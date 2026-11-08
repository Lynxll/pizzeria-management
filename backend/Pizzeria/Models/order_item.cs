using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class order_item
{
    public int id { get; set; }

    public int order_id { get; set; }

    public int pizza_id { get; set; }

    public int quantity { get; set; }

    public decimal price_at_order { get; set; }

    public virtual order order { get; set; } = null!;

    public virtual pizza pizza { get; set; } = null!;

    public OrderItemStatus Status { get; set; } = OrderItemStatus.InKitchen;
    public bool collector_cancelled_resolved { get; set; }
}
