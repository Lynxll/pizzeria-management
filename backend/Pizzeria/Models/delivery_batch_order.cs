namespace Pizzeria.Models;

public class delivery_batch_order
{
    public int id { get; set; }

    public int batch_id { get; set; }
    public delivery_batch? batch { get; set; }

    public int order_id { get; set; }
    public order? order { get; set; }

    public int sequence { get; set; }

    public DateTimeOffset added_at { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? delivered_at { get; set; }
    public DateTimeOffset? removed_at { get; set; }
}
