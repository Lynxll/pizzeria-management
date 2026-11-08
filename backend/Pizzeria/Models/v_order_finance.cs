using System;
using System.Collections.Generic;

namespace Pizzeria.Models;

public partial class v_order_finance
{
    public int? order_id { get; set; }

    public decimal? items_total { get; set; }

    public int? discount_id { get; set; }

    public decimal? discount_value { get; set; }

    public decimal? discount_amount { get; set; }

    public decimal? total_after_discount { get; set; }
}
