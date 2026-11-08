using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace Pizzeria.Data;

public partial class PizzeriaContext : IdentityDbContext<IdentityUser>
{
    public PizzeriaContext(DbContextOptions<PizzeriaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<customer> customers { get; set; }

    public virtual DbSet<delivery> deliveries { get; set; }

    public virtual DbSet<discount> discounts { get; set; }

    public virtual DbSet<employee> employees { get; set; }

    public virtual DbSet<ingredient> ingredients { get; set; }

    public virtual DbSet<menu> menus { get; set; }

    public virtual DbSet<order> orders { get; set; }

    public virtual DbSet<order_item> order_items { get; set; }

    public virtual DbSet<pizza> pizzas { get; set; }

    public virtual DbSet<pizza_recipe> pizza_recipes { get; set; }

    public virtual DbSet<review> reviews { get; set; }
    public virtual DbSet<refresh_token> refresh_tokens { get; set; }

    public virtual DbSet<v_order_finance> v_order_finances { get; set; }

    public DbSet<delivery_batch> delivery_batches => Set<delivery_batch>();
    public DbSet<delivery_batch_order> delivery_batch_orders => Set<delivery_batch_order>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresEnum<DiscountType>("pizzeria", "discount_type");
        modelBuilder.HasPostgresEnum<OrderStatus>("pizzeria", "order_status");
        modelBuilder.HasPostgresEnum<DeliveryStatus>("pizzeria", "delivery_status");
        modelBuilder.HasPostgresEnum<EmployeeRole>("pizzeria", "employee_role");
        modelBuilder.HasPostgresEnum<OrderItemStatus>("pizzeria", "order_item_status");

        modelBuilder.Entity<discount>(e =>
        {
            e.Property(x => x.type)
             .HasColumnName("type")
             .HasColumnType("pizzeria.discount_type"); 
                                                       
        });
        modelBuilder.Entity<employee>(entity =>
        {
            entity.Property(e => e.Role)
                  .HasColumnName("role")     
                  .HasColumnType("pizzeria.employee_role"); 
        });
        modelBuilder.Entity<delivery>(e =>
        {
            e.Property(x => x.Status)
             .HasColumnName("status")
             .HasColumnType("pizzeria.delivery_status");
        });
        modelBuilder.Entity<v_order_finance>(e =>
        {
            e.HasNoKey();
            e.ToView("v_order_finance", "pizzeria"); 
        });
        modelBuilder.Entity<order>(e =>
        {
            e.Property(x => x.Status)
             .HasColumnName("status")
             .HasColumnType("pizzeria.order_status");

        });
        modelBuilder.Entity<customer>(entity =>
        {
            entity.HasKey(e => e.id).HasName("customers_pkey");
            entity.ToTable("customers", "pizzeria");
            entity.HasIndex(e => e.email, "customers_email_key").IsUnique();
            entity.Property(e => e.id).HasDefaultValueSql("nextval('customers_id_seq'::regclass)");

            entity
                .HasOne(c => c.user)
                .WithMany()
                .HasForeignKey(c => c.user_id)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<delivery>(entity =>
        {
            entity.HasKey(e => e.id).HasName("deliveries_pkey");

            entity.ToTable("deliveries", "pizzeria");

            entity.HasIndex(e => e.order_id, "deliveries_order_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("nextval('deliveries_id_seq'::regclass)");
            entity.Property(e => e.end_time).HasColumnType("timestamp without time zone");
            entity.Property(e => e.start_time).HasColumnType("timestamp without time zone");
            entity.Property(e => e.ready_at).HasColumnType("timestamp without time zone");
            entity.Property(e => e.queue_position);

            entity.HasOne(d => d.courier).WithMany(p => p.deliveries)
                .HasForeignKey(d => d.courier_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("deliveries_courier_id_fkey");

            entity.HasOne(d => d.order).WithOne(p => p.delivery)
                .HasForeignKey<delivery>(d => d.order_id)
                .HasConstraintName("deliveries_order_id_fkey");
        });

        modelBuilder.Entity<discount>(entity =>
        {
            entity.HasKey(e => e.id).HasName("discounts_pkey");

            entity.ToTable("discounts", "pizzeria");

            entity.HasIndex(e => e.code, "discounts_code_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("nextval('discounts_id_seq'::regclass)");
            entity.Property(e => e.value).HasPrecision(10, 2);
        });

        modelBuilder.Entity<employee>(entity =>
        {
            entity.HasKey(e => e.id).HasName("employees_pkey");

            entity.ToTable("employees", "pizzeria");

            entity.Property(e => e.id).HasDefaultValueSql("nextval('employees_id_seq'::regclass)");
            entity.Property(e => e.is_on_shift).HasColumnName("is_on_shift");
            entity.Property(e => e.is_out_for_delivery)
                .HasColumnName("is_out_for_delivery")
                .HasDefaultValue(false);
            entity.Property(e => e.route_anchor_lat)
                .HasColumnName("route_anchor_lat")
                .HasColumnType("numeric(9,6)");
            entity.Property(e => e.route_anchor_lng)
                .HasColumnName("route_anchor_lng")
                .HasColumnType("numeric(9,6)");
            entity.Property(e => e.break_until)
                  .HasColumnType("timestamp without time zone");
        });

        modelBuilder.Entity<ingredient>(entity =>
        {
            entity.HasKey(e => e.id).HasName("ingredients_pkey");

            entity.ToTable("ingredients", "pizzeria");

            entity.HasIndex(e => e.name, "ingredients_name_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("nextval('ingredients_id_seq'::regclass)");
        });

        modelBuilder.Entity<menu>(entity =>
        {
            entity.HasKey(e => e.id).HasName("menu_pkey");

            entity.ToTable("menu", "pizzeria");

            entity.HasIndex(e => e.pizza_id, "uq_menu_active_one")
                .IsUnique()
                .HasFilter("is_active");

            entity.Property(e => e.id).HasDefaultValueSql("nextval('menu_id_seq'::regclass)");
            entity.Property(e => e.is_active).HasDefaultValue(true);
            entity.Property(e => e.price).HasPrecision(10, 2);

            entity.HasOne(d => d.pizza).WithOne(p => p.menu)
                .HasForeignKey<menu>(d => d.pizza_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("menu_pizza_id_fkey");
        });

        modelBuilder.Entity<order>(entity =>
        {
            entity.HasKey(e => e.id).HasName("orders_pkey");

            entity.ToTable("orders", "pizzeria");

            entity.HasIndex(e => e.order_date, "idx_orders_date");

            entity.HasIndex(e => e.geocode_status)
                .HasDatabaseName("ix_orders_geocode_status");

            entity.HasIndex(e => new { e.delivery_lat, e.delivery_lng })
                .HasDatabaseName("ix_orders_delivery_lat_lng");

            entity.Property(e => e.id)
                .HasDefaultValueSql("nextval('orders_id_seq'::regclass)");

            entity.Property(e => e.order_date)
                .HasDefaultValueSql("now()")
                .HasColumnType("timestamp without time zone");

            entity.Property(e => e.total_amount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("0");

            entity.Property(e => e.Status)
                .HasColumnName("status")
                .HasColumnType("pizzeria.order_status");

            entity.Property(e => e.delivery_lat)
                .HasColumnName("delivery_lat")
                .HasColumnType("numeric(9,6)");

            entity.Property(e => e.delivery_lng)
                .HasColumnName("delivery_lng")
                .HasColumnType("numeric(9,6)");

            entity.Property(e => e.geocode_status)
                .HasColumnName("geocode_status")
                .HasConversion<short>()
                .HasDefaultValue(GeocodeStatus.Pending);

            entity.Property(e => e.geocode_precision)
                .HasColumnName("geocode_precision");

            entity.Property(e => e.geocoded_at)
                .HasColumnName("geocoded_at")
                .HasColumnType("timestamp without time zone");

            entity.Property(e => e.geocode_source)
                .HasColumnName("geocode_source");

            entity.Property(e => e.location_confirmed)
                .HasColumnName("location_confirmed")
                .HasDefaultValue(false);

            entity.HasCheckConstraint(
                "ck_orders_delivery_lat",
                "\"delivery_lat\" IS NULL OR (\"delivery_lat\" >= -90 AND \"delivery_lat\" <= 90)"
            );

            entity.HasCheckConstraint(
                "ck_orders_delivery_lng",
                "\"delivery_lng\" IS NULL OR (\"delivery_lng\" >= -180 AND \"delivery_lng\" <= 180)"
            );

            entity.HasOne(d => d.customer).WithMany(p => p.orders)
                .HasForeignKey(d => d.customer_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("orders_customer_id_fkey");

            entity.HasOne(d => d.discount).WithMany(p => p.orders)
                .HasForeignKey(d => d.discount_id)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("orders_discount_id_fkey");

            entity.Property(e => e.collector_state_since)
                .HasColumnName("collector_state_since")
                .HasColumnType("timestamp without time zone");
        });


        modelBuilder.Entity<order_item>(entity =>
        {
            entity.HasKey(e => e.id).HasName("order_items_pkey");

            entity.ToTable("order_items", "pizzeria");

            entity.HasIndex(e => e.order_id, "idx_items_order");

            entity.Property(e => e.id).HasDefaultValueSql("nextval('order_items_id_seq'::regclass)");
            entity.Property(e => e.price_at_order).HasPrecision(10, 2);

            entity.Property(e => e.Status)
                  .HasColumnName("status")
                  .HasColumnType("pizzeria.order_item_status");

            entity.HasOne(d => d.order).WithMany(p => p.order_items)
                .HasForeignKey(d => d.order_id)
                .HasConstraintName("order_items_order_id_fkey");

            entity.HasOne(d => d.pizza).WithMany(p => p.order_items)
                .HasForeignKey(d => d.pizza_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("order_items_pizza_id_fkey");
            entity.Property(e => e.collector_cancelled_resolved)
                .HasColumnName("collector_cancelled_resolved")
                .HasColumnType("boolean");

        });

        modelBuilder.Entity<pizza>(entity =>
        {
            entity.HasKey(e => e.id).HasName("pizzas_pkey");

            entity.ToTable("pizzas", "pizzeria");

            entity.HasIndex(e => e.name, "pizzas_name_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("nextval('pizzas_id_seq'::regclass)");
            entity.Property(e => e.cost_price).HasPrecision(10, 2);
        });

        modelBuilder.Entity<pizza_recipe>(entity =>
        {
            entity.HasKey(e => new { e.pizza_id, e.ingredient_id }).HasName("pizza_recipes_pkey");

            entity.ToTable("pizza_recipes", "pizzeria");

            entity.HasOne(d => d.ingredient).WithMany(p => p.pizza_recipes)
                .HasForeignKey(d => d.ingredient_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("pizza_recipes_ingredient_id_fkey");

            entity.HasOne(d => d.pizza).WithMany(p => p.pizza_recipes)
                .HasForeignKey(d => d.pizza_id)
                .HasConstraintName("pizza_recipes_pizza_id_fkey");
        });

        modelBuilder.Entity<review>(entity =>
        {
            entity.HasKey(e => e.id).HasName("reviews_pkey");

            entity.ToTable("reviews", "pizzeria");

            entity.HasIndex(e => e.order_id, "reviews_order_id_key").IsUnique();

            entity.Property(e => e.id).HasDefaultValueSql("nextval('reviews_id_seq'::regclass)");

            entity.HasOne(d => d.order).WithOne(p => p.review)
                .HasForeignKey<review>(d => d.order_id)
                .HasConstraintName("reviews_order_id_fkey");
        });

        modelBuilder.Entity<refresh_token>(entity =>
        {
            entity.HasKey(e => e.id).HasName("refresh_tokens_pkey");

            entity.ToTable("refresh_tokens", "pizzeria");

            entity.HasIndex(e => e.token_hash, "ux_refresh_tokens_token_hash").IsUnique();
            entity.HasIndex(e => e.user_id, "ix_refresh_tokens_user_id");

            entity.Property(e => e.id).HasDefaultValueSql("nextval('pizzeria.refresh_tokens_id_seq'::regclass)");
            entity.Property(e => e.user_id).IsRequired();
            entity.Property(e => e.token_hash).IsRequired();
            entity.Property(e => e.created_at).HasColumnType("timestamp without time zone");
            entity.Property(e => e.expires_at).HasColumnType("timestamp without time zone");
            entity.Property(e => e.revoked_at).HasColumnType("timestamp without time zone");

            entity.HasOne(e => e.user)
                .WithMany()
                .HasForeignKey(e => e.user_id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<v_order_finance>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("v_order_finance", "pizzeria");

            entity.Property(e => e.discount_value).HasPrecision(10, 2);
        });
        modelBuilder.Entity<delivery_batch>(e =>
        {
            e.ToTable("delivery_batches", "pizzeria");

            e.HasKey(x => x.id);

            e.Property(x => x.status)
                .HasConversion<short>();

            e.Property(x => x.created_at)
                .HasDefaultValueSql("now()");

            e.HasOne(x => x.courier)
                .WithMany() 
                .HasForeignKey(x => x.courier_id)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.courier_id, x.status })
                .HasDatabaseName("ix_delivery_batches_courier_status");
        });
        modelBuilder.Entity<delivery_batch_order>(e =>
        {
            e.ToTable("delivery_batch_orders", "pizzeria");

            e.HasKey(x => x.id);

            e.Property(x => x.added_at)
                .HasDefaultValueSql("now()");

            e.HasOne(x => x.batch)
                .WithMany(b => b.batch_orders)
                .HasForeignKey(x => x.batch_id)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.order)
                .WithMany(o => o.delivery_batch_orders)
                .HasForeignKey(x => x.order_id)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.batch_id, x.order_id })
                .IsUnique()
                .HasDatabaseName("ux_batch_orders_batch_order");

            e.HasIndex(x => new { x.batch_id, x.sequence })
                .IsUnique()
                .HasDatabaseName("ux_batch_orders_batch_sequence");

            e.HasIndex(x => x.batch_id).HasDatabaseName("ix_batch_orders_batch");
            e.HasIndex(x => x.order_id).HasDatabaseName("ix_batch_orders_order");

            e.HasIndex(x => x.order_id)
                .IsUnique()
                .HasDatabaseName("ux_order_only_one_active_batch")
                .HasFilter("\"removed_at\" IS NULL AND \"delivered_at\" IS NULL");
        });
        OnModelCreatingPartial(modelBuilder);
    }
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);

}
