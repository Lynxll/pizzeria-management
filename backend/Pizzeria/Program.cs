using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Npgsql;
using Pizzeria.Data;
using Pizzeria.Models;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.IdentityModel.Tokens;
using System.Reflection;
using Microsoft.AspNetCore.Identity;
using Pizzeria.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddUserSecrets(Assembly.GetExecutingAssembly(), optional: true);


var cs = builder.Configuration.GetConnectionString("PizzeriaDb")!;
var dsb = new NpgsqlDataSourceBuilder(cs);
dsb.MapEnum<DiscountType>("pizzeria.discount_type");
dsb.MapEnum<OrderStatus>("pizzeria.order_status");
dsb.MapEnum<DeliveryStatus>("pizzeria.delivery_status");
dsb.MapEnum<EmployeeRole>("pizzeria.employee_role");
dsb.MapEnum<OrderItemStatus>("pizzeria.order_item_status");
var dataSource = dsb.Build();

builder.Services.AddDbContext<PizzeriaContext>(opt =>
    opt.UseNpgsql(dataSource, npgsql =>
        npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "pizzeria")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials());
});

builder.Services.AddMemoryCache();
builder.Services.AddScoped<IOrderDeliverySyncService, OrderDeliverySyncService>();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.WriteIndented = true;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Pizzeria";
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Set Jwt:Key to a private value of at least 32 bytes.");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            IssuerSigningKey = signingKey,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(t => t.FullName!.Replace("+", "."));

    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Pizzeria", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Вставь сюда: **Bearer {твой_JWT}**"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddIdentityCore<IdentityUser>(opt =>
{
    opt.User.RequireUniqueEmail = true;
    opt.Password.RequiredLength = 6;
    opt.Password.RequireNonAlphanumeric = false;
    opt.Password.RequireUppercase = false;
    opt.Password.RequireDigit = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<PizzeriaContext>()
.AddSignInManager();

builder.Services.AddHttpClient<IGeocodingService, NominatimGeocodingService>(client =>
{
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        builder.Configuration["Nominatim:UserAgent"] ?? "PizzeriaMVP/1.0"
    );
});

builder.Services.Configure<GraphHopperOptions>(
    builder.Configuration.GetSection(GraphHopperOptions.SectionName));
builder.Services.AddHttpClient<IGraphHopperCourierRouteService, GraphHopperCourierRouteService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PizzeriaAPI/1.0");
});
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();

// JwtTokenService
builder.Services.AddScoped<JwtTokenService>();

builder.Services.Configure<EmailOptions>(
    builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
builder.Services.AddSingleton<IEmailQueue, EmailQueue>();
builder.Services.AddHostedService<EmailBackgroundService>();
builder.Services.AddScoped<IOrderNotificationService, OrderNotificationService>();
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    var ghLen = app.Configuration["GraphHopper:ApiKey"]?.Trim().Length ?? 0;
    app.Logger.LogInformation(
        "GraphHopper:ApiKey в итоговой конфигурации — длина {Len} после Trim (0 значит секрет не подставился, смотри user-secrets / GraphHopper__ApiKey).",
        ghLen);
}

using (var scope = app.Services.CreateScope())
{
    await DevIdentitySeed.RunAsync(app.Configuration, app.Logger, scope.ServiceProvider)
        .ConfigureAwait(false);
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();   
app.UseAuthorization();

app.MapControllers();

app.Run();
