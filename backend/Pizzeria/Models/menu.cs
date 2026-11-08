using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class menu
{
    public int id { get; set; }

    public int pizza_id { get; set; }

    public decimal price { get; set; }

    public bool is_active { get; set; }

    public virtual pizza pizza { get; set; } = null!;
}
