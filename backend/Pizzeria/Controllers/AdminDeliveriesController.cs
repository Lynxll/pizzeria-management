using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers
{
    [ApiController]
    [Route("api/admin/deliveries")]
    [Authorize(Roles = "Admin")]
    public class AdminDeliveriesController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public AdminDeliveriesController(PizzeriaContext context) => _context = context;

        public record UpdateQueuePositionDto(int queue_position);
        public record ReassignCourierDto(int courier_id);

        // /api/admin/deliveries/ready-queue
        [HttpGet("ready-queue")]
        public async Task<IActionResult> GetReadyQueue()
        {
            var now = DateTime.Now;

            var deliveries = await _context.Set<delivery>()
                .Include(d => d.order)
                .Include(d => d.courier)
                .Where(d =>
                    d.order.Status == OrderStatus.Ready &&
                    (d.Status == DeliveryStatus.New ||
                     d.Status == DeliveryStatus.Assigned))
                .OrderBy(d => d.queue_position ?? int.MaxValue)
                .ThenBy(d => d.ready_at ?? d.order.order_date)
                .AsNoTracking()
                .ToListAsync();

            var result = deliveries.Select(d =>
            {
                var readyFrom = d.ready_at ?? d.order.order_date;
                var waitingFromReadySeconds = (int)(now - readyFrom).TotalSeconds;
                var waitingFromCreatedSeconds = (int)(now - d.order.order_date).TotalSeconds;

                return new
                {
                    d.id,
                    d.order_id,
                    d.courier_id,
                    courier_name = d.courier?.name,
                    d.queue_position,

                    ready_at = readyFrom,
                    waiting_seconds = waitingFromReadySeconds,

                    order_created_at = d.order.order_date,
                    order_waiting_seconds = waitingFromCreatedSeconds,

                    order_contact_name = d.order.contact_name,
                    order_address = d.order.delivery_address
                };
            });

            return Ok(result);
        }

        // /api/admin/deliveries/{id}/queue-position?position=2
        [HttpPatch("{id:int}/queue-position")]
        public async Task<IActionResult> UpdateQueuePosition(int id, [FromQuery] int position)
        {
            var entity = await _context.Set<delivery>()
                .Include(d => d.order)
                .FirstOrDefaultAsync(d => d.id == id);

            if (entity is null) return NotFound();

            if (entity.Status != DeliveryStatus.New &&
                entity.Status != DeliveryStatus.Assigned)
            {
                return Conflict(new { message = "Можно менять позицию только для доставок в очереди (новый/назначен)" });
            }

            if (entity.order == null || entity.order.Status != OrderStatus.Ready)
            {
                return Conflict(new { message = "Можно менять очередь только для заказов в статусе 'готов'" });
            }

            entity.queue_position = position;
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // /api/admin/deliveries/{id}/reassign-courier?courierId=6
        [HttpPatch("{id:int}/reassign-courier")]
        public async Task<IActionResult> ReassignCourier(int id, [FromQuery] int courierId)
        {
            var entity = await _context.Set<delivery>()
                .FirstOrDefaultAsync(d => d.id == id);

            if (entity is null) return NotFound();

            if (entity.Status == DeliveryStatus.Delivered ||
                entity.Status == DeliveryStatus.Cancelled)
            {
                return Conflict(new
                {
                    message = "Нельзя переназначить курьера завершённой или отменённой доставки"
                });
            }

            var courier = await _context.Set<employee>()
                .FirstOrDefaultAsync(e => e.id == courierId);

            if (courier is null || courier.Role != EmployeeRole.Courier)
                return Conflict(new { message = "Указанный сотрудник не является курьером" });

            entity.courier_id = courierId;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
