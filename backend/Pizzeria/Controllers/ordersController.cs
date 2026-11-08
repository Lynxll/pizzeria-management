using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;
using Pizzeria.Services;

namespace Pizzeria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ordersController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        private readonly IOrderDeliverySyncService _deliverySync;
        private readonly IOrderNotificationService _notifications;

        public ordersController(
            PizzeriaContext context,
            IOrderDeliverySyncService deliverySync,
            IOrderNotificationService notifications)
        {
            _context = context;
            _deliverySync = deliverySync;
            _notifications = notifications;
        }

        // DTOшки
        public class CreateOrderDto
        {
            public string delivery_address { get; set; } = null!;
            public int? discount_id { get; set; }

            public string? contact_name { get; set; }
            public string? contact_phone { get; set; }
            public string? contact_email { get; set; }
            public string? comment { get; set; }

            public decimal? change_from { get; set; }
            public bool pay_cash { get; set; }
            public bool need_call_courier { get; set; }

            public decimal? delivery_lat { get; set; }
            public decimal? delivery_lng { get; set; }
            public bool location_confirmed { get; set; }
        }

        public record SetDiscountDto(int? discount_id);
        public record SetStatusDto(string status);

        // GET /api/orders
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] string? customerId,
            [FromQuery] OrderStatus? status,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;

            if (!TryParseOptionalCustomerId(customerId, out var customerIdFilter, out var customerIdError))
                return BadRequest(new { message = customerIdError });

            var baseQ = _context.Set<order>()
                .Include(o => o.customer)
                .Include(o => o.discount)
                .AsNoTracking()
                .AsQueryable();

            if (customerIdFilter.HasValue) baseQ = baseQ.Where(o => o.customer_id == customerIdFilter.Value);
            if (status.HasValue) baseQ = baseQ.Where(o => o.Status == status.Value);
            if (from.HasValue) baseQ = baseQ.Where(o => o.order_date >= from.Value);
            if (to.HasValue) baseQ = baseQ.Where(o => o.order_date < to.Value);

            var totalRows = await baseQ.CountAsync();

            var joinedQ =
                from o in baseQ
                join d in _context.Set<delivery>().AsNoTracking()
                      on o.id equals d.order_id into dgrp
                from d in dgrp.DefaultIfEmpty()
                select new
                {
                    o.id,
                    o.order_date,
                    o.customer_id,
                    customer_name = o.customer.name,
                    o.delivery_address,
                    o.discount_id,
                    status = o.Status.ToString(),
                    o.total_amount,
                    delivery_end_time = d != null ? d.end_time : null,
                    delivery_status = d != null ? d.Status.ToString() : null
                };

            var pageItems = await joinedQ
                .OrderByDescending(x => x.id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var ids = pageItems.Select(i => i.id).ToArray();
            var fin = await _context.Set<v_order_finance>()
                .AsNoTracking()
                .Where(v => ids.Contains(v.order_id ?? 0))
                .ToDictionaryAsync(v => v.order_id!.Value);

            var result = pageItems.Select(i => new
            {
                i.id,
                i.order_date,
                i.customer_id,
                i.customer_name,
                i.delivery_address,
                i.discount_id,
                i.status,
                i.total_amount,
                delivery_end_time = i.delivery_end_time,
                delivery_status = i.delivery_status,
                finance = fin.TryGetValue(i.id, out var f) ? new
                {
                    f.items_total,
                    f.discount_id,
                    f.discount_value,
                    f.discount_amount,
                    f.total_after_discount
                } : null
            });

            return Ok(new { total = totalRows, page, pageSize, items = result });
        }

        // GET /api/orders/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Set<order>()
                .Include(o => o.customer)
                .Include(o => o.discount)
                .Include(o => o.order_items)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.id == id);

            if (order is null) return NotFound();

            var fin = await _context.Set<v_order_finance>()
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.order_id == id);

            var d = await _context.Set<delivery>()
                .Include(x => x.courier)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.order_id == id);

            var delivery = d is null ? null : new
            {
                d.id,
                d.start_time,
                d.end_time,
                status = d.Status.ToString(),
                courier_id = d.courier_id,
                courier_name = d.courier?.name
            };

            return Ok(new
            {
                order,
                finance = fin,
                delivery
            });
        }

        // POST /api/orders
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var customer = await _context.customers
                .Where(c => c.user_id == userId)
                .OrderBy(c => c.id)
                .FirstOrDefaultAsync();

            if (customer is null)
                return Conflict(new { message = "Профиль клиента не найден" });

            if (dto.discount_id is int did)
            {
                var dExists = await _context.Set<discount>().AnyAsync(d => d.id == did);
                if (!dExists) return Conflict(new { message = "Скидка не найдена" });
            }
            if (dto.delivery_lat is null || dto.delivery_lng is null)
                return BadRequest(new { message = "Выберите точку доставки на карте." });
            var entity = new order
            {
                customer_id = customer.id,
                delivery_address = dto.delivery_address,
                discount_id = dto.discount_id,
                order_date = DateTime.Now,
                total_amount = 0m,
                Status = OrderStatus.Accepted,

                // новые поля
                contact_name = dto.contact_name,
                contact_phone = dto.contact_phone,
                contact_email = dto.contact_email,
                comment = dto.comment,
                change_from = dto.change_from,
                pay_cash = dto.pay_cash,
                need_call_courier = dto.need_call_courier,
                delivery_lat = dto.delivery_lat is null ? null : Math.Round(dto.delivery_lat.Value, 6),
                delivery_lng = dto.delivery_lng is null ? null : Math.Round(dto.delivery_lng.Value, 6),

                location_confirmed = dto.location_confirmed,
                geocode_status = dto.location_confirmed ? GeocodeStatus.Ok : GeocodeStatus.Pending,
                geocoded_at = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
            };

            _context.Set<order>().Add(entity);
            await _context.SaveChangesAsync();

            await _context.Database.ExecuteSqlRawAsync("select sync_order_total({0})", entity.id);

            return CreatedAtAction(nameof(GetById), new { id = entity.id }, new { entity.id });
        }

        // PUT /api/orders/{id}/discount
        [HttpPut("{id:int}/discount")]
        [Authorize]
        public async Task<IActionResult> SetDiscount(int id, [FromBody] SetDiscountDto dto)
        {
            var entity = await _context.Set<order>().FindAsync(id);
            if (entity is null) return NotFound();

            if (dto.discount_id is int did)
            {
                var dExists = await _context.Set<discount>().AnyAsync(d => d.id == did);
                if (!dExists) return Conflict(new { message = "Скидка не найдена" });
            }

            entity.discount_id = dto.discount_id;
            await _context.SaveChangesAsync();

            await _context.Database.ExecuteSqlRawAsync("select sync_order_total({0})", id);

            return NoContent();
        }

        // PUT /api/orders/{id}/status
        [HttpPut("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> SetStatus(int id, [FromBody] SetStatusDto dto)
        {
            if (!TryParseOrderStatus(dto.status, out var newStatus))
                return BadRequest(new { message = "Некорректный статус заказа" });

            var entity = await _context.Set<order>().FindAsync(id);
            if (entity is null) return NotFound();

            var oldStatus = entity.Status;
            entity.Status = newStatus;

            await _context.SaveChangesAsync();
            await _deliverySync.SyncDeliveryForOrderStatusAsync(entity);

            if (oldStatus != newStatus)
                await _notifications.NotifyStatusChangedAsync(entity.id, newStatus);

            return NoContent();
        }

        /// <summary>
        /// Фронт иногда подставляет строку "null" в query (например customerId из JWT/профиля отсутствует у сборщика).
        /// </summary>
        private static bool TryParseOptionalCustomerId(string? raw, out int? id, out string? error)
        {
            id = null;
            error = null;
            if (string.IsNullOrWhiteSpace(raw)) return true;
            var t = raw.Trim();
            if (string.Equals(t, "null", StringComparison.OrdinalIgnoreCase)) return true;
            if (int.TryParse(t, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
            {
                id = n;
                return true;
            }

            error = "Некорректный customerId в запросе.";
            return false;
        }

        private static bool TryParseOrderStatus(string input, out OrderStatus status)
        {
            status = default;
            if (string.IsNullOrWhiteSpace(input)) return false;

            if (Enum.TryParse<OrderStatus>(input, true, out status)) return true;

            if (int.TryParse(input, out var n) && Enum.IsDefined(typeof(OrderStatus), n))
            {
                status = (OrderStatus)n;
                return true;
            }

            switch (input.Trim().ToLowerInvariant())
            {
                case "принят":
                    status = OrderStatus.Accepted; return true;
                case "готовится":
                    status = OrderStatus.Cooking; return true;
                case "готов":
                    status = OrderStatus.Ready; return true;
                case "в пути":
                    status = OrderStatus.InTransit; return true;
                case "доставлен":
                    status = OrderStatus.Delivered; return true;
                case "отменен":
                    status = OrderStatus.Cancelled; return true;
                default:
                    return false;
            }
        }


        // POST /api/orders/{id}/recalc
        [HttpPost("{id:int}/recalc")]
        [Authorize]
        public async Task<IActionResult> Recalc(int id)
        {
            var exists = await _context.Set<order>().AnyAsync(o => o.id == id);
            if (!exists) return NotFound();

            await _context.Database.ExecuteSqlRawAsync("select sync_order_total({0})", id);
            return NoContent();

        }
    }
}
