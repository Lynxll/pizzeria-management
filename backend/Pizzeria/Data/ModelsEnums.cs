using NpgsqlTypes;

namespace Pizzeria.Models
{
    public enum OrderStatus
    {
        [PgName("принят")]
        Accepted,

        [PgName("готовится")]
        Cooking,

        [PgName("готов")]
        Ready,

        [PgName("в пути")]
        InTransit,

        [PgName("доставлен")]
        Delivered,

        [PgName("отменен")]
        Cancelled,
    }


    public enum DeliveryStatus
    {
        [PgName("новый")]
        New,

        [PgName("назначен")]
        Assigned,

        [PgName("в пути")]
        InProgress,

        [PgName("доставлен")]
        Delivered,

        [PgName("отменен")]
        Cancelled,
    }

    public enum EmployeeRole
    {
        [PgName("курьер")] Courier,
        [PgName("повар")] Cook,
        [PgName("сборщик")] Collector,
        [PgName("администратор")] Admin

    }

    public enum DiscountType
    {
        [PgName("промокод")] PromoCode,
        [PgName("накопительная")] Loyalty
    }
    public enum OrderItemStatus
    {
        [PgName("на кухне")]
        InKitchen,            

        [PgName("приготовлено")]
        Cooked,            

        [PgName("у сборщика")]
        ReceivedByCollector,   

        [PgName("упаковано")]
        Packed                 
    }

    public enum GeocodeStatus : short
    {
        Pending = 0,
        Ok = 1,
        NotFound = 2,
        Ambiguous = 3
    }
    public enum DeliveryBatchStatus : short
    {
        Active = 0,
        Finished = 1,
        Cancelled = 2
    }
}