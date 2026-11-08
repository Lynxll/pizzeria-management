namespace Pizzeria.Models;

public class delivery_batch
{
    public int id { get; set; }

    public int courier_id { get; set; }
    public employee? courier { get; set; }

    public DeliveryBatchStatus status { get; set; } = DeliveryBatchStatus.Active;

    public DateTimeOffset created_at { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? started_at { get; set; }
    public DateTimeOffset? finished_at { get; set; }

    public List<delivery_batch_order> batch_orders { get; set; } = new();
}
