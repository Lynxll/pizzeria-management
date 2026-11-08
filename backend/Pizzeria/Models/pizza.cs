using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class pizza
{
    public int id { get; set; }

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public decimal cost_price { get; set; }

    public virtual menu? menu { get; set; }

    public virtual ICollection<order_item> order_items { get; set; } = new List<order_item>();

    public virtual ICollection<pizza_recipe> pizza_recipes { get; set; } = new List<pizza_recipe>();
}
