using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class review
{
    public int id { get; set; }

    public int order_id { get; set; }

    public int rating { get; set; }

    public string? comment { get; set; }

    public virtual order order { get; set; } = null!;
    
    public bool is_approved { get; set; } = false;
}
