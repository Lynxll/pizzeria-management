using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class deliveriesController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public deliveriesController(PizzeriaContext context) => _context = context;

        public record CreateDeliveryDto(int order_id, int courier_id);
        public record UpdateDeliveryStatusDto(string status);

        // /api/deliveries?status=InTransit
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DeliveryStatus? status)
        {
            var q = _context.Set<delivery>()
                .Include(d => d.order)
                .Include(d => d.courier)
                .AsNoTracking();

            if (status.HasValue)
                q = q.Where(d => d.Status == status.Value);

            var list = await q
                .OrderByDescending(d => d.id)
                .Select(d => new
                {
                    d.id,
                    d.order_id,
                    d.courier_id,
                    courier_name = d.courier.name,
                    d.start_time,
                    d.end_time,
                    status = d.Status.ToString()
                })
                .ToListAsync();

            return Ok(list);
        }

        // /api/deliveries/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var d = await _context.Set<delivery>()
                .Include(x => x.courier)
                .Include(x => x.order)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == id);

            return d is null ? NotFound() : Ok(d);
        }

        // /api/deliveries
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDeliveryDto dto)
        {
            var orderExists = await _context.Set<order>().AnyAsync(o => o.id == dto.order_id);
            if (!orderExists) return Conflict(new { message = "Заказ не найден" });

            var courier = await _context.Set<employee>().FirstOrDefaultAsync(e => e.id == dto.courier_id);
            if (courier is null || courier.Role.ToString() != "Courier")
                return Conflict(new { message = "Указанный сотрудник не является курьером" });

            var already = await _context.Set<delivery>().AnyAsync(d => d.order_id == dto.order_id);
            if (already) return Conflict(new { message = "Для этого заказа уже создана доставка" });

            var entity = new delivery
            {
                order_id = dto.order_id,
                courier_id = dto.courier_id,
                start_time = DateTime.Now,
                end_time = null,
                Status = DeliveryStatus.InProgress
            };

            _context.Set<delivery>().Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.id }, entity);
        }

        // /api/deliveries/{id}/status
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateDeliveryStatusDto dto)
        {
            if (!TryParseDeliveryStatus(dto.status, out var newStatus))
                return BadRequest(new { message = "Некорректный статус доставки" });

            var entity = await _context.Set<delivery>().FindAsync(id);
            if (entity is null) return NotFound();

            if (entity.Status == DeliveryStatus.Delivered && newStatus != DeliveryStatus.Delivered)
                return Conflict(new { message = "Нельзя изменить статус после доставки" });

            entity.Status = newStatus;

            if (newStatus == DeliveryStatus.Delivered)
                entity.end_time = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // /api/deliveries/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Set<delivery>().FindAsync(id);
            if (entity is null) return NotFound();

            _context.Set<delivery>().Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static bool TryParseDeliveryStatus(string input, out DeliveryStatus status)
        {
            status = default;

            if (string.IsNullOrWhiteSpace(input))
                return false;

            if (Enum.TryParse<DeliveryStatus>(input, ignoreCase: true, out status))
                return true;

            if (int.TryParse(input, out var num) && Enum.IsDefined(typeof(DeliveryStatus), num))
            {
                status = (DeliveryStatus)num;
                return true;
            }

            var norm = input.Trim().ToLowerInvariant();
            switch (norm)
            {
                case "в пути":
                case "впути":
                    status = DeliveryStatus.InProgress;
                    return true;

                case "назначен":
                    status = DeliveryStatus.Assigned;
                    return true;

                case "доставлен":
                case "доставлено":
                    status = DeliveryStatus.Delivered;
                    return true;

                case "новый":
                    status = DeliveryStatus.New;
                    return true;

                case "отменен":
                    status = DeliveryStatus.Cancelled;
                    return true;
            }

            return false;
        }
    }
}
