using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Pizzeria.Data;
using Pizzeria.Dtos;
using Pizzeria.Models;
using Pizzeria.Services;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _users;
    private readonly SignInManager<IdentityUser> _signIn;
    private readonly JwtTokenService _jwt;
    private readonly PizzeriaContext _db;
    private readonly IRefreshTokenService _refresh;
    private readonly TimeSpan _refreshLifetime;
    private readonly bool _secureCookies;
    private readonly SameSiteMode _refreshCookieSameSite;
    private const string RefreshCookieName = "refreshToken";

    public AuthController(
        UserManager<IdentityUser> users,
        SignInManager<IdentityUser> signIn,
        JwtTokenService jwt,
        PizzeriaContext db,
        IRefreshTokenService refresh,
        IConfiguration cfg)
    {
        _users = users;
        _signIn = signIn;
        _jwt = jwt;
        _db = db;
        _refresh = refresh;
        var days = cfg.GetValue<int?>("Jwt:RefreshTokenDays") ?? 14;
        _refreshLifetime = TimeSpan.FromDays(Math.Clamp(days, 1, 90));
        var sameSite = cfg["Jwt:RefreshCookieSameSite"] ?? "None";
        _refreshCookieSameSite = ParseSameSite(sameSite);

        // SameSite=None requires Secure=true in modern browsers.
        var secureFromConfig = cfg.GetValue<bool?>("Jwt:RefreshCookieSecure");
        _secureCookies = _refreshCookieSameSite == SameSiteMode.None
            ? true
            : (secureFromConfig ?? true);
    }

    // Регистрация
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var user = new IdentityUser
        {
            UserName = dto.email,
            Email = dto.email,
            EmailConfirmed = true
        };

        var result = await _users.CreateAsync(user, dto.password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        var customer = new customer
        {
            name = dto.name,
            phone = dto.phone,
            address = dto.address,
            email = dto.email,
            user_id = user.Id
        };

        _db.customers.Add(customer);
        await _db.SaveChangesAsync();

        var token = await _jwt.Create(user);
        var refreshRaw = await _refresh.IssueAsync(user.Id, HttpContext.Connection.RemoteIpAddress?.ToString(), _refreshLifetime);
        SetRefreshCookie(refreshRaw);
        return Ok(new { token });
    }

    // Логин
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _users.FindByEmailAsync(dto.email);
        if (user == null)
            return Unauthorized("Invalid credentials");

        var check = await _signIn.CheckPasswordSignInAsync(user, dto.password, lockoutOnFailure: false);
        if (!check.Succeeded)
            return Unauthorized("Invalid credentials");

        var token = await _jwt.Create(user);
        var refreshRaw = await _refresh.IssueAsync(user.Id, HttpContext.Connection.RemoteIpAddress?.ToString(), _refreshLifetime);
        SetRefreshCookie(refreshRaw);
        return Ok(new { token });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var raw) || string.IsNullOrWhiteSpace(raw))
            return Unauthorized(new { message = "Refresh token отсутствует." });

        try
        {
            var (newRaw, userId, reuse) = await _refresh.RotateAsync(
                raw,
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                _refreshLifetime,
                cancellationToken);

            if (reuse)
            {
                DeleteRefreshCookie();
                return Unauthorized(new { message = "Обнаружено повторное использование refresh token. Выполните вход заново." });
            }

            var user = await _users.FindByIdAsync(userId);
            if (user is null)
            {
                DeleteRefreshCookie();
                return Unauthorized();
            }

            var access = await _jwt.Create(user);
            SetRefreshCookie(newRaw);
            return Ok(new { token = access });
        }
        catch (UnauthorizedAccessException)
        {
            DeleteRefreshCookie();
            return Unauthorized(new { message = "Refresh token невалиден или истёк." });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

        if (Request.Cookies.TryGetValue(RefreshCookieName, out var raw) && !string.IsNullOrWhiteSpace(raw))
        {
            await _refresh.RevokeAsync(raw, ip, cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(userId))
            await _refresh.RevokeAllForUserAsync(userId, ip, cancellationToken);

        DeleteRefreshCookie();
        return NoContent();
    }

    // Текущий пользователь
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
            return Unauthorized();

        var user = await _users.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized();

        var roles = await _users.GetRolesAsync(user);
        var isAdmin = roles.Contains("Admin");
        var isCourier = roles.Contains("Courier");
        var isCook = roles.Contains("Cook");
        var isCollector = roles.Contains("Collector");

        var customer = await _db.customers
            .AsNoTracking()
            .Where(c => c.user_id == userId)
            .Select(c => new
            {
                c.id,
                c.name,
                c.phone,
                c.address,
                c.email
            })
            .FirstOrDefaultAsync();

        if (customer == null)
        {
            return Ok(new
            {
                id = (int?)null,
                name = user.UserName ?? user.Email ?? "",
                phone = "",
                address = "",
                email = user.Email ?? "",
                roles,
                isAdmin,
                isCourier,
                isCook,
                isCollector
            });
        }

        return Ok(new
        {
            customer.id,
            customer.name,
            customer.phone,
            customer.address,
            customer.email,
            roles,
            isAdmin,
            isCourier,
            isCook,
            isCollector
        });
    }

    private void SetRefreshCookie(string rawToken)
    {
        Response.Cookies.Append(RefreshCookieName, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = _secureCookies,
            SameSite = _refreshCookieSameSite,
            Expires = DateTimeOffset.UtcNow.Add(_refreshLifetime),
            // Use /api to avoid path case-mismatch (e.g. /api/Auth/* from frontend).
            Path = "/api"
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = _secureCookies,
            SameSite = _refreshCookieSameSite,
            // Delete must use the same path as set.
            Path = "/api"
        });
    }

    private static SameSiteMode ParseSameSite(string value)
    {
        return value.Trim().ToLowerInvariant() switch
        {
            "none" => SameSiteMode.None,
            "lax" => SameSiteMode.Lax,
            "strict" => SameSiteMode.Strict,
            _ => SameSiteMode.None
        };
    }
}
