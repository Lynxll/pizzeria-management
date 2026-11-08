using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Pizzeria.Services;

public class JwtTokenService
{
    private readonly string _issuer;
    private readonly SymmetricSecurityKey _key;
    private readonly UserManager<IdentityUser> _users;
    private readonly TimeSpan _defaultAccessLifetime;

    public JwtTokenService(IConfiguration cfg, UserManager<IdentityUser> users)
    {
        _issuer = cfg["Jwt:Issuer"] ?? "Pizzeria";
        var key = cfg["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("Set Jwt:Key to a private value of at least 32 bytes.");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        _users = users;
        var minutes = cfg.GetValue<int?>("Jwt:AccessTokenMinutes") ?? 15;
        _defaultAccessLifetime = TimeSpan.FromMinutes(Math.Clamp(minutes, 1, 240));
    }

    public async Task<string> Create(IdentityUser user, TimeSpan? lifetime = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty)
        };

        // РОЛИ → в клеймы
        var roles = await _users.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role)); // важно: ClaimTypes.Role
        }

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: null,
            claims: claims,
            notBefore: now,
            expires: now.Add(lifetime ?? _defaultAccessLifetime),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
