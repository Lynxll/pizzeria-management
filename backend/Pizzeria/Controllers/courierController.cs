using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;
using Pizzeria.Services;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/courier")]
[Authorize(Roles = "Courier")]
public class CourierController : ControllerBase
{
    private readonly PizzeriaContext _context;
    private readonly IOrderNotificationService _notifications;

    public CourierController(PizzeriaContext context, IOrderNotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    private async Task<employee?> GetCurrentCourier()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;

        return await _context.employees
            .FirstOrDefaultAsync(e => e.user_id == userId && e.Role == EmployeeRole.Courier);
    }


    [HttpGet("state")]
    public async Task<IActionResult> GetState()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var now = DateTime.Now;
        var isOnBreak = courier.break_until.HasValue && courier.break_until > now;

        return Ok(new
        {
            isOnShift = courier.is_on_shift,
            isOnBreak,
            breakUntil = courier.break_until,
            isOutForDelivery = courier.is_out_for_delivery
        });
    }


    [HttpPost("shift/start")]
    public async Task<IActionResult> StartShift()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        courier.is_on_shift = true;
        courier.break_until = null;

        await _context.SaveChangesAsync();
        await AssignWaitingDeliveriesToCouriers();

        return NoContent();
    }

    [HttpPost("shift/stop")]
    public async Task<IActionResult> StopShift()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var deliveries = await _context.Set<delivery>()
            .Where(d => d.courier_id == courier.id &&
                        (d.Status == DeliveryStatus.New ||
                         d.Status == DeliveryStatus.Assigned ||
                         d.Status == DeliveryStatus.InProgress))
            .ToListAsync();

        if (deliveries.Any(d => d.Status == DeliveryStatus.InProgress))
        {
            return BadRequest(new
            {
                message = "Нельзя закончить смену, пока есть заказ 'в пути'."
            });
        }

        foreach (var d in deliveries)
        {
            d.courier_id = null;
            d.Status = DeliveryStatus.New;
        }

        courier.is_on_shift = false;
        courier.break_until = null;
        courier.is_out_for_delivery = false;
        courier.route_anchor_lat = null;
        courier.route_anchor_lng = null;

        await _context.SaveChangesAsync();
        return NoContent();
    }


    [HttpPost("break/start")]
    public async Task<IActionResult> StartBreak()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        if (!courier.is_on_shift)
            return BadRequest(new { message = "Смена не начата" });

        courier.break_until = DateTime.Now.AddMinutes(15);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("break/stop")]
    public async Task<IActionResult> StopBreak()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        courier.break_until = null;

        await _context.SaveChangesAsync();
        await AssignWaitingDeliveriesToCouriers();

        return NoContent();
    }


    [HttpGet("orders/active")]
    public async Task<IActionResult> GetActiveOrders()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var deliveries = await _context.Set<delivery>()
            .Include(d => d.order)
                .ThenInclude(o => o.customer)
            .Where(d =>
                d.courier_id == courier.id &&
                (d.Status == DeliveryStatus.Assigned || d.Status == DeliveryStatus.InProgress))
            .OrderBy(d => d.queue_position ?? int.MaxValue)
            .ThenBy(d => d.ready_at ?? d.start_time ?? DateTime.MaxValue)
            .ToListAsync();

        // “Окно доступности” считается ТОЛЬКО по Assigned
        var minAssignedPos = deliveries
            .Where(d => d.Status == DeliveryStatus.Assigned && d.queue_position.HasValue)
            .Select(d => d.queue_position!.Value)
            .DefaultIfEmpty(int.MaxValue)
            .Min();

        var items = deliveries.Select(d => new
        {
            d.id,
            d.order_id,
            delivery_status = d.Status.ToString(),
            d.queue_position,
            d.ready_at,
            d.start_time,

            // доступно к "Взять" только если Assigned и входит в первые 4 позиции; не в рейсе «выехал»
            is_available_for_take =
                !courier.is_out_for_delivery &&
                d.Status == DeliveryStatus.Assigned &&
                d.queue_position.HasValue &&
                d.queue_position.Value <= minAssignedPos + 3,

            order = new
            {
                d.order!.delivery_address,
                delivery_lat = d.order.delivery_lat,
                delivery_lng = d.order.delivery_lng,
                d.order.location_confirmed,
                geocode_status = d.order.geocode_status.ToString(),

                d.order.total_amount,
                customer_name = d.order.customer!.name,
                d.order.contact_name,
                d.order.contact_phone,
                d.order.contact_email,
                d.order.comment,
                d.order.pay_cash,
                d.order.change_from,
                d.order.need_call_courier
            }
        }).ToList();

        // “Активный” = первый InProgress, если его нет — первый Assigned
        var active = items.FirstOrDefault(x => x.delivery_status == DeliveryStatus.InProgress.ToString())
                  ?? items.FirstOrDefault(x => x.delivery_status == DeliveryStatus.Assigned.ToString());

        return Ok(new
        {
            active,
            queue = items // вся очередь курьера (Assigned + InProgress)
        });
    }



    [HttpPost("orders/{deliveryId:int}/take")]
    public async Task<IActionResult> TakeOrder(int deliveryId, CancellationToken cancellationToken)
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var d = await _context.Set<delivery>()
            .Include(x => x.order)
            .FirstOrDefaultAsync(x => x.id == deliveryId);

        if (d is null) return NotFound();

        if (d.courier_id != courier.id)
            return Forbid();

        if (d.Status != DeliveryStatus.Assigned)
            return BadRequest(new { message = "Заказ уже взят или завершён" });

        if (!d.queue_position.HasValue)
            return BadRequest(new { message = "У заказа нет позиции в очереди" });

        // minPos — только среди Assigned этого курьера
        var minPos = await _context.Set<delivery>()
            .Where(x =>
                x.courier_id == courier.id &&
                x.Status == DeliveryStatus.Assigned &&
                x.queue_position.HasValue)
            .MinAsync(x => (int?)x.queue_position)  // nullable min
            ?? int.MaxValue;

        if (d.queue_position.Value > minPos + 3)
        {
            return BadRequest(new { message = "Этот заказ пока недоступен для взятия" });
        }

        if (courier.is_out_for_delivery)
        {
            return BadRequest(new
            {
                message = "Нельзя взять новый заказ, пока вы в рейсе. Отметьте прибытие на базу."
            });
        }

        d.Status = DeliveryStatus.InProgress;
        d.start_time ??= DateTime.Now;

        var becameInTransit = d.order != null && d.order.Status == OrderStatus.Ready;
        if (becameInTransit)
            d.order!.Status = OrderStatus.InTransit;

        await _context.SaveChangesAsync();

        if (becameInTransit && d.order != null)
            await _notifications.NotifyStatusChangedAsync(d.order.id, OrderStatus.InTransit, cancellationToken)
                .ConfigureAwait(false);

        return NoContent();
    }


    [HttpPost("orders/{deliveryId:int}/complete")]
    public async Task<IActionResult> CompleteOrder(int deliveryId, CancellationToken cancellationToken)
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var d = await _context.Set<delivery>()
            .Include(x => x.order)
            .FirstOrDefaultAsync(x => x.id == deliveryId);

        if (d is null) return NotFound();

        if (d.courier_id != courier.id)
            return Forbid();

        if (d.Status != DeliveryStatus.InProgress &&
            d.Status != DeliveryStatus.Assigned)
            return BadRequest(new { message = "Неверный статус доставки" });

        d.Status = DeliveryStatus.Delivered;
        d.end_time = DateTime.Now;

        int? orderIdForDeliveredNotify = null;
        if (d.order != null &&
            (d.order.Status == OrderStatus.InTransit ||
             d.order.Status == OrderStatus.Ready))
        {
            d.order.Status = OrderStatus.Delivered;
            orderIdForDeliveredNotify = d.order.id;
        }

        var remainingInProgress = await _context.Set<delivery>().CountAsync(x =>
            x.courier_id == courier.id &&
            x.Status == DeliveryStatus.InProgress &&
            x.id != d.id);

        if (d.order?.delivery_lat is not { } dLat || d.order.delivery_lng is not { } dLng)
        {
            courier.route_anchor_lat = null;
            courier.route_anchor_lng = null;
        }
        else if (courier.is_out_for_delivery)
        {
            courier.route_anchor_lat = dLat;
            courier.route_anchor_lng = dLng;
        }
        else
        {
            courier.route_anchor_lat = null;
            courier.route_anchor_lng = null;
        }

        await _context.SaveChangesAsync();

        if (orderIdForDeliveredNotify is int oid)
            await _notifications.NotifyStatusChangedAsync(oid, OrderStatus.Delivered, cancellationToken)
                .ConfigureAwait(false);

        return NoContent();
    }

    [HttpPost("trip/depart")]
    public async Task<IActionResult> DepartForDelivery()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var hasInProgress = await _context.Set<delivery>().AnyAsync(d =>
            d.courier_id == courier.id && d.Status == DeliveryStatus.InProgress);

        if (!hasInProgress)
            return BadRequest(new { message = "Нет заказов в доставке (в пути). Сначала возьмите хотя бы один заказ." });

        courier.is_out_for_delivery = true;
        courier.route_anchor_lat = null;
        courier.route_anchor_lng = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("trip/return")]
    public async Task<IActionResult> ReturnToBase()
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        courier.is_out_for_delivery = false;
        courier.route_anchor_lat = null;
        courier.route_anchor_lng = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }


    private async Task AssignWaitingDeliveriesToCouriers()
    {
        var now = DateTime.Now;

        var couriers = await _context.employees
            .Where(e =>
                e.Role == EmployeeRole.Courier &&
                e.is_on_shift &&
                (!e.break_until.HasValue || e.break_until < now))
            .ToListAsync();

        if (couriers.Count == 0)
            return;

        var waiting = await _context.Set<delivery>()
            .Where(d => d.Status == DeliveryStatus.New && d.courier_id == null)
            .OrderBy(d => d.queue_position ?? int.MaxValue)
            .ThenBy(d => d.ready_at ?? d.start_time ?? DateTime.MaxValue)
            .ToListAsync();

        if (waiting.Count == 0)
            return;

        var busy = await _context.Set<delivery>()
            .Where(d =>
                d.courier_id != null &&
                (d.Status == DeliveryStatus.Assigned ||
                 d.Status == DeliveryStatus.InProgress))
            .GroupBy(d => d.courier_id!.Value)
            .Select(g => new { courier_id = g.Key, count = g.Count() })
            .ToDictionaryAsync(x => x.courier_id, x => x.count);

        foreach (var d in waiting)
        {
            var bestCourier = couriers
                .OrderBy(c => busy.TryGetValue(c.id, out var cnt) ? cnt : 0)
                .FirstOrDefault();

            if (bestCourier == null)
                break;

            d.courier_id = bestCourier.id;
            d.Status = DeliveryStatus.Assigned;

            busy[bestCourier.id] = busy.TryGetValue(bestCourier.id, out var cnt2) ? cnt2 + 1 : 1;
        }

        await _context.SaveChangesAsync();
    }
}
