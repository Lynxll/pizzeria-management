using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class employee
{
    public int id { get; set; }

    public string name { get; set; } = null!;

    public bool is_on_shift { get; set; }

    public bool is_out_for_delivery { get; set; }

    public decimal? route_anchor_lat { get; set; }

    public decimal? route_anchor_lng { get; set; }

    public string user_id { get; set; } = null!;

    public DateTime? break_until { get; set; }

    public virtual ICollection<delivery> deliveries { get; set; } = new List<delivery>();

    public EmployeeRole Role { get; set; }

}
