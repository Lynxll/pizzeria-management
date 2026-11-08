using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class pizza_recipe
{
    public int pizza_id { get; set; }

    public int ingredient_id { get; set; }

    public string quantity { get; set; } = null!;

    public virtual ingredient ingredient { get; set; } = null!;

    public virtual pizza pizza { get; set; } = null!;
}
