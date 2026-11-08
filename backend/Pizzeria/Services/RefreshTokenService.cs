using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Services;

public interface IRefreshTokenService
{
    Task<string> IssueAsync(string userId, string? ip, TimeSpan lifetime, CancellationToken cancellationToken = default);
    Task<(string NewRawToken, string UserId, bool ReuseDetected)> RotateAsync(string rawToken, string? ip, TimeSpan lifetime, CancellationToken cancellationToken = default);
    Task RevokeAsync(string rawToken, string? ip, CancellationToken cancellationToken = default);
    Task RevokeAllForUserAsync(string userId, string? ip, CancellationToken cancellationToken = default);
}

public sealed class RefreshTokenService : IRefreshTokenService
{
    private readonly PizzeriaContext _db;

    public RefreshTokenService(PizzeriaContext db)
    {
        _db = db;
    }

    public async Task<string> IssueAsync(string userId, string? ip, TimeSpan lifetime, CancellationToken cancellationToken = default)
    {
        var raw = GenerateRawToken();
        var hash = Hash(raw);
        var now = DbNow();
        var item = new refresh_token
        {
            user_id = userId,
            token_hash = hash,
            created_at = now,
            expires_at = now.Add(lifetime),
            created_by_ip = ip
        };
        _db.refresh_tokens.Add(item);
        await _db.SaveChangesAsync(cancellationToken);
        return raw;
    }

    public async Task<(string NewRawToken, string UserId, bool ReuseDetected)> RotateAsync(
        string rawToken,
        string? ip,
        TimeSpan lifetime,
        CancellationToken cancellationToken = default)
    {
        var now = DbNow();
        var hash = Hash(rawToken);
        var current = await _db.refresh_tokens.FirstOrDefaultAsync(x => x.token_hash == hash, cancellationToken);
        if (current is null)
            throw new UnauthorizedAccessException("refresh_not_found");

        // Reuse detection: token already revoked but requested again.
        if (current.revoked_at.HasValue)
        {
            await RevokeAllForUserAsync(current.user_id, ip, cancellationToken);
            return ("", current.user_id, true);
        }

        if (current.expires_at <= now)
            throw new UnauthorizedAccessException("refresh_expired");

        var newRaw = GenerateRawToken();
        var newHash = Hash(newRaw);

        current.revoked_at = now;
        current.revoked_by_ip = ip;
        current.replaced_by_token_hash = newHash;

        var next = new refresh_token
        {
            user_id = current.user_id,
            token_hash = newHash,
            created_at = now,
            expires_at = now.Add(lifetime),
            created_by_ip = ip
        };
        _db.refresh_tokens.Add(next);
        await _db.SaveChangesAsync(cancellationToken);
        return (newRaw, current.user_id, false);
    }

    public async Task RevokeAsync(string rawToken, string? ip, CancellationToken cancellationToken = default)
    {
        var hash = Hash(rawToken);
        var item = await _db.refresh_tokens.FirstOrDefaultAsync(x => x.token_hash == hash, cancellationToken);
        if (item is null || item.revoked_at.HasValue)
            return;

        item.revoked_at = DbNow();
        item.revoked_by_ip = ip;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllForUserAsync(string userId, string? ip, CancellationToken cancellationToken = default)
    {
        var now = DbNow();
        var active = await _db.refresh_tokens
            .Where(x => x.user_id == userId && x.revoked_at == null && x.expires_at > now)
            .ToListAsync(cancellationToken);

        foreach (var t in active)
        {
            t.revoked_at = now;
            t.revoked_by_ip = ip;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    // PostgreSQL columns are timestamp without time zone; keep DateTime Kind=Unspecified.
    private static DateTime DbNow() => DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

    private static string GenerateRawToken()
    {
        Span<byte> bytes = stackalloc byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string Hash(string raw)
    {
        var data = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(data).ToLowerInvariant();
    }
}
