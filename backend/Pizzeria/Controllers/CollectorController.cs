using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;
using Pizzeria.Services;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Collector")]
public class CollectorController : ControllerBase
{
    private readonly PizzeriaContext _context;
    private readonly IOrderDeliverySyncService _deliverySync;
    private readonly IOrderNotificationService _notifications;

    public CollectorController(
        PizzeriaContext context,
        IOrderDeliverySyncService deliverySync,
        IOrderNotificationService notifications)
    {
        _context = context;
        _deliverySync = deliverySync;
        _notifications = notifications;
    }

    // DTO

    public record CollectorItemDto(
        int id,
        string pizza_name,
        int quantity,
        OrderItemStatus status
    );

    public record CollectorOrderDto(
        int order_id,
        DateTime order_date,
        string? customer_name,
        string? address,
        bool is_cancelled,
        DateTime? collector_state_since,
        List<CollectorItemDto> items
    );

    public record CancelledItemDto(
        int order_id,
        int order_item_id,
        string pizza_name,
        int quantity,
        OrderItemStatus status
    );

    public record CollectorDashboardDto(
        List<CollectorOrderDto> orders,
        List<CancelledItemDto> cancelled_items
    );

    // GET /api/collector/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var ordersQuery = _context.orders
            .Include(o => o.customer)
            .Include(o => o.order_items)
                .ThenInclude(oi => oi.pizza)
            .Where(o =>
                (o.Status == OrderStatus.Accepted ||
                 o.Status == OrderStatus.Cooking ||
                 o.Status == OrderStatus.Ready) &&
                o.order_items.Any(oi =>
                    oi.Status == OrderItemStatus.InKitchen ||
                    oi.Status == OrderItemStatus.Cooked ||
                    oi.Status == OrderItemStatus.ReceivedByCollector)
            )
            .AsNoTracking();

        var orders = await ordersQuery
            .OrderBy(o => o.order_date)
            .Select(o => new CollectorOrderDto(
                o.id,                                    
                o.order_date,                               
                o.customer != null ? o.customer.name : null, 
                o.customer != null ? o.customer.address : null, 
                false,                                      
                o.collector_state_since,                     
                o.order_items
                    .Where(oi =>
                        oi.Status == OrderItemStatus.InKitchen ||
                        oi.Status == OrderItemStatus.Cooked ||
                        oi.Status == OrderItemStatus.ReceivedByCollector)
                    .Select(oi => new CollectorItemDto(
                        oi.id,
                        oi.pizza!.name,
                        oi.quantity,
                        oi.Status
                    ))
                    .ToList()
            ))
            .ToListAsync();

        var cancelledItems = await _context.orders
            .Include(o => o.order_items)
                .ThenInclude(oi => oi.pizza)
            .Where(o => o.Status == OrderStatus.Cancelled)
            .SelectMany(o => o.order_items
                .Where(oi =>
                    !oi.collector_cancelled_resolved &&
                    (oi.Status == OrderItemStatus.Cooked ||
                     oi.Status == OrderItemStatus.ReceivedByCollector))
                .Select(oi => new CancelledItemDto(
                    o.id,
                    oi.id,
                    oi.pizza!.name,
                    oi.quantity,
                    oi.Status
                )))
            .AsNoTracking()
            .ToListAsync();

        return Ok(new CollectorDashboardDto(orders, cancelledItems));
    }

    // POST /api/collector/items/{orderItemId}/mark-received
    [HttpPost("items/{orderItemId:int}/mark-received")]
    public async Task<IActionResult> MarkItemReceived([FromRoute] int orderItemId)
    {
        var item = await _context.order_items
            .Include(oi => oi.order)
                .ThenInclude(o => o.order_items)
            .FirstOrDefaultAsync(oi => oi.id == orderItemId);

        if (item == null)
            return NotFound(new { message = "Позиция заказа не найдена." });

        var order = item.order;
        if (order == null)
            return BadRequest(new { message = "У позиции нет связанного заказа." });

        if (order.Status == OrderStatus.Cancelled)
            return BadRequest(new { message = "Заказ отменён, позицию нельзя пометить как полученную сборщиком." });

        if (item.Status != OrderItemStatus.Cooked)
            return BadRequest(new { message = $"Позиция имеет статус '{item.Status}', её нельзя пометить как полученную сборщиком." });

        if (order.Status != OrderStatus.Accepted &&
            order.Status != OrderStatus.Cooking &&
            order.Status != OrderStatus.Ready)
        {
            return BadRequest(new { message = "Нельзя пометить позицию для этого заказа." });
        }

        item.Status = OrderItemStatus.ReceivedByCollector;

        if (order.collector_state_since == null)
        {
            bool allCookedOrBeyond = order.order_items.All(oi =>
                oi.Status == OrderItemStatus.Cooked ||
                oi.Status == OrderItemStatus.ReceivedByCollector ||
                oi.Status == OrderItemStatus.Packed
            );

            if (allCookedOrBeyond)
            {
                var nowUnspecified = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                order.collector_state_since = nowUnspecified;
            }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            item.id,
            item.order_id,
            status = item.Status.ToString()
        });
    }


    // POST /api/collector/orders/{orderId}/mark-packed
    [HttpPost("orders/{orderId:int}/mark-packed")]
    public async Task<IActionResult> MarkOrderPacked([FromRoute] int orderId, CancellationToken cancellationToken)
    {
        var order = await _context.orders
            .Include(o => o.order_items)
            .FirstOrDefaultAsync(o => o.id == orderId, cancellationToken);

        if (order == null)
            return NotFound(new { message = "Заказ не найден." });

        var statusBefore = order.Status;

        if (!order.order_items.Any())
            return BadRequest(new { message = "У заказа нет позиций." });

        if (order.Status == OrderStatus.Cancelled)
            return BadRequest(new { message = "Отменённый заказ нельзя пометить как собранный." });

        var notReadyItems = order.order_items
            .Where(oi => oi.Status == OrderItemStatus.InKitchen ||
                         oi.Status == OrderItemStatus.Cooked)
            .ToList();

        if (notReadyItems.Any())
        {
            return BadRequest(new
            {
                message = "Не все позиции дошли до сборщика. Нельзя отметить заказ как собранный.",
                items = notReadyItems.Select(i => new { i.id, Status = i.Status.ToString() })
            });
        }

        foreach (var item in order.order_items.Where(oi => oi.Status == OrderItemStatus.ReceivedByCollector))
        {
            item.Status = OrderItemStatus.Packed;
        }

        if (order.Status == OrderStatus.Accepted || order.Status == OrderStatus.Cooking)
        {
            order.Status = OrderStatus.Ready;
        }

        if (order.collector_state_since == null)
        {
            order.collector_state_since = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (order.Status == OrderStatus.Ready)
            await _deliverySync.SyncDeliveryForOrderStatusAsync(order, cancellationToken);

        if (statusBefore != OrderStatus.Ready && order.Status == OrderStatus.Ready)
            await _notifications.NotifyStatusChangedAsync(order.id, OrderStatus.Ready, cancellationToken)
                .ConfigureAwait(false);

        return Ok(new
        {
            order_id = order.id,
            status = order.Status.ToString()
        });
    }

    // POST /api/collector/cancelled-items/{orderItemId}/resolve
    [HttpPost("cancelled-items/{orderItemId:int}/resolve")]
    public async Task<IActionResult> ResolveCancelledItem([FromRoute] int orderItemId)
    {
        var item = await _context.order_items
            .Include(oi => oi.order)
            .FirstOrDefaultAsync(oi => oi.id == orderItemId);

        if (item == null)
            return NotFound(new { message = "Позиция заказа не найдена." });

        if (item.order == null || item.order.Status != OrderStatus.Cancelled)
            return BadRequest(new { message = "Эта позиция не относится к отменённому заказу." });

        if (!(item.Status == OrderItemStatus.Cooked ||
              item.Status == OrderItemStatus.ReceivedByCollector))
        {
            return BadRequest(new { message = "Эта позиция не в состоянии для обработки сборщиком." });
        }

        item.collector_cancelled_resolved = true;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            item.id,
            resolved = true
        });
    }
}
