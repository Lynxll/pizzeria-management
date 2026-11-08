using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class delivery
{
    public int id { get; set; }

    public int order_id { get; set; }

    public int? courier_id { get; set; }

    public DateTime? start_time { get; set; }

    public DateTime? end_time { get; set; }

    public DateTime? ready_at { get; set; }

    public int? queue_position { get; set; }

    public virtual employee courier { get; set; } = null!;

    public virtual order order { get; set; } = null!;

    public DeliveryStatus Status { get; set; }

}
