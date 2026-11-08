namespace Pizzeria.Models;

public class refresh_token
{
    public int id { get; set; }

    public string user_id { get; set; } = null!;
    public Microsoft.AspNetCore.Identity.IdentityUser? user { get; set; }

    public string token_hash { get; set; } = null!;

    public DateTime created_at { get; set; }
    public DateTime expires_at { get; set; }
    public DateTime? revoked_at { get; set; }

    public string? created_by_ip { get; set; }
    public string? revoked_by_ip { get; set; }

    public string? replaced_by_token_hash { get; set; }
}
