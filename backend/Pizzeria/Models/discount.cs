using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class discount
{
    public int id { get; set; }

    public decimal value { get; set; }

    public string? code { get; set; }

    public DateOnly? valid_until { get; set; }

    public virtual ICollection<order> orders { get; set; } = new List<order>();

    public DiscountType type { get; set; }

}
