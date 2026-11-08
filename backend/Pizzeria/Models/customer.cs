// Models/customer.cs
using Microsoft.AspNetCore.Identity;

namespace Pizzeria.Models;

public class customer
{
    public int id { get; set; }
    public string name { get; set; } = "";
    public string? phone { get; set; }
    public string? address { get; set; }
    public string? email { get; set; }

    public string? user_id { get; set; }
    public IdentityUser? user { get; set; }

    public ICollection<order> orders { get; set; } = new List<order>();
}
