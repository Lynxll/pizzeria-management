using System;
using System.Collections.Generic;
using Pizzeria.Models;

public partial class order
{
    public int id { get; set; }

    public int customer_id { get; set; }

    public DateTime order_date { get; set; }

    public string delivery_address { get; set; } = null!;

    public int? discount_id { get; set; }

    public decimal? total_amount { get; set; }

    public string? contact_name { get; set; }

    public string? contact_phone { get; set; }

    public string? contact_email { get; set; }

    public string? comment { get; set; }

    public decimal? change_from { get; set; }

    public bool pay_cash { get; set; }

    public bool need_call_courier { get; set; }

    public virtual customer customer { get; set; } = null!;

    public virtual delivery? delivery { get; set; }

    public virtual discount? discount { get; set; }

    public virtual ICollection<order_item> order_items { get; set; } = new List<order_item>();

    public virtual review? review { get; set; }

    public OrderStatus Status { get; set; }
    public DateTime? collector_state_since { get; set; }

    public decimal? delivery_lat { get; set; }
    public decimal? delivery_lng { get; set; }

    public GeocodeStatus geocode_status { get; set; } = GeocodeStatus.Pending;

    public string? geocode_precision { get; set; }
    public DateTime? geocoded_at { get; set; }
    public string? geocode_source { get; set; }

    public bool location_confirmed { get; set; } = false;
    public List<delivery_batch_order> delivery_batch_orders { get; set; } = new();
}

