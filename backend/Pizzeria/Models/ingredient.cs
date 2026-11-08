using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class ingredient
{
    public int id { get; set; }

    public string name { get; set; } = null!;

    public virtual ICollection<pizza_recipe> pizza_recipes { get; set; } = new List<pizza_recipe>();
}
