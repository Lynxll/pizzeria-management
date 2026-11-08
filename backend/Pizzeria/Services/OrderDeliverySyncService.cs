using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Services;

public interface IOrderDeliverySyncService
{
    /// <summary>
    /// Создаёт/обновляет доставку и очередь при смене статуса заказа (готов / в пути / доставлен / отменён).
    /// </summary>
    Task SyncDeliveryForOrderStatusAsync(order order, CancellationToken cancellationToken = default);
}

public sealed class OrderDeliverySyncService : IOrderDeliverySyncService
{
    private readonly PizzeriaContext _context;

    public OrderDeliverySyncService(PizzeriaContext context)
    {
        _context = context;
    }

    public async Task SyncDeliveryForOrderStatusAsync(order order, CancellationToken cancellationToken = default)
    {
        var delivery = await _context.Set<delivery>()
            .FirstOrDefaultAsync(d => d.order_id == order.id, cancellationToken)
            .ConfigureAwait(false);

        if (order.Status == OrderStatus.Ready)
        {
            var now = DateTime.Now;

            if (delivery == null)
            {
                delivery = new delivery
                {
                    order_id = order.id,
                    ready_at = now,
                    Status = DeliveryStatus.New
                };
                _context.Set<delivery>().Add(delivery);
            }
            else
            {
                if (delivery.ready_at == null)
                    delivery.ready_at = now;

                if (delivery.Status == 0)
                    delivery.Status = DeliveryStatus.New;
            }

            var maxPos = await _context.Set<delivery>()
                .Where(d =>
                    d.Status == DeliveryStatus.New ||
                    d.Status == DeliveryStatus.Assigned)
                .MaxAsync(d => (int?)d.queue_position, cancellationToken)
                .ConfigureAwait(false) ?? 0;

            if (delivery.queue_position == null || delivery.queue_position <= 0)
                delivery.queue_position = maxPos + 1;

            var courier = await FindAvailableCourierAsync(cancellationToken).ConfigureAwait(false);
            if (courier != null)
            {
                delivery.courier_id = courier.id;
                delivery.Status = DeliveryStatus.Assigned;
            }
            else
            {
                delivery.courier_id = null;
                delivery.Status = DeliveryStatus.New;
            }

            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return;
        }

        if (order.Status == OrderStatus.InTransit && delivery != null)
        {
            if (delivery.Status != DeliveryStatus.InProgress)
            {
                delivery.Status = DeliveryStatus.InProgress;
                delivery.start_time ??= DateTime.Now;
                await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            }

            return;
        }

        if (order.Status == OrderStatus.Delivered && delivery != null)
        {
            delivery.Status = DeliveryStatus.Delivered;
            delivery.end_time ??= DateTime.Now;
            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return;
        }

        if (order.Status == OrderStatus.Cancelled && delivery != null)
        {
            delivery.Status = DeliveryStatus.Cancelled;
            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task<employee?> FindAvailableCourierAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.Now;

        var couriers = await _context.employees
            .Where(e =>
                e.Role == EmployeeRole.Courier &&
                e.is_on_shift &&
                (e.break_until == null || e.break_until < now))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        if (couriers.Count == 0)
            return null;

        var busy = await _context.Set<delivery>()
            .Where(d =>
                d.courier_id != null &&
                (d.Status == DeliveryStatus.Assigned ||
                 d.Status == DeliveryStatus.InProgress))
            .GroupBy(d => d.courier_id)
            .Select(g => new { courier_id = g.Key!.Value, count = g.Count() })
            .ToDictionaryAsync(x => x.courier_id, x => x.count, cancellationToken)
            .ConfigureAwait(false);

        return couriers
            .OrderBy(c => busy.TryGetValue(c.id, out var cCount) ? cCount : 0)
            .First();
    }
}
