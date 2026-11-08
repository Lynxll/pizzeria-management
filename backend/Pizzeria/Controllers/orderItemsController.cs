using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers
{
    [ApiController]
    [Route("api/orders/{orderId:int}/items")]
    public class orderItemsController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public orderItemsController(PizzeriaContext context) => _context = context;

        public record OrderItemAddDto(int pizza_id, int quantity);
        public record OrderItemUpdateDto(int quantity);

        // GET: /api/orders/{orderId}/items
        [HttpGet]
        public async Task<IActionResult> GetList(int orderId)
        {
            var exists = await _context.orders.AnyAsync(o => o.id == orderId);
            if (!exists) return NotFound(new { message = "Заказ не найден" });

            var list = await _context.order_items
                .Where(i => i.order_id == orderId)
                .Include(i => i.pizza)
                .AsNoTracking()
                .Select(i => new
                {
                    i.id,
                    i.pizza_id,
                    pizza_name = i.pizza.name,
                    i.quantity,
                    i.price_at_order
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET: /api/orders/{orderId}/items/{itemId}
        [HttpGet("{itemId:int}")]
        public async Task<IActionResult> GetOne(int orderId, int itemId)
        {
            var item = await _context.order_items
                .Include(i => i.pizza)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.id == itemId && i.order_id == orderId);

            return item is null ? NotFound() : Ok(new
            {
                item.id,
                item.pizza_id,
                pizza_name = item.pizza?.name,
                item.quantity,
                item.price_at_order
            });
        }

        // POST: /api/orders/{orderId}/items
        [HttpPost]
        public async Task<IActionResult> Add(int orderId, [FromBody] OrderItemAddDto dto)
        {
            if (dto.quantity <= 0)
                return BadRequest(new { message = "quantity должен быть > 0" });

            var order = await _context.orders.FindAsync(orderId);
            if (order is null)
                return NotFound(new { message = "Заказ не найден" });

            // Берём цену из активного меню
            var menuItem = await _context.menus
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.pizza_id == dto.pizza_id && m.is_active);
            if (menuItem is null)
                return Conflict(new { message = "Пицца недоступна в меню" });

            var entity = new order_item
            {
                order_id = orderId,
                pizza_id = dto.pizza_id,
                quantity = dto.quantity,
                price_at_order = menuItem.price
            };

            _context.order_items.Add(entity);
            await _context.SaveChangesAsync();

            await _context.Database.ExecuteSqlRawAsync("SELECT pizzeria.sync_order_total({0})", orderId);

            return CreatedAtAction(nameof(GetOne), new { orderId, itemId = entity.id }, new { entity.id });
        }

        // PUT: /api/orders/{orderId}/items/{itemId}
        [HttpPut("{itemId:int}")]
        public async Task<IActionResult> Update(int orderId, int itemId, [FromBody] OrderItemUpdateDto dto)
        {
            if (dto.quantity <= 0)
                return BadRequest(new { message = "quantity должен быть > 0" });

            var entity = await _context.order_items.FirstOrDefaultAsync(i => i.id == itemId);
            if (entity is null) return NotFound();
            if (entity.order_id != orderId)
                return Conflict(new { message = "Позиция не принадлежит этому заказу" });

            entity.quantity = dto.quantity;
            await _context.SaveChangesAsync();

            await _context.Database.ExecuteSqlRawAsync("SELECT pizzeria.sync_order_total({0})", orderId);
            return NoContent();
        }

        // DELETE: /api/orders/{orderId}/items/{itemId}
        [HttpDelete("{itemId:int}")]
        public async Task<IActionResult> Delete(int orderId, int itemId)
        {
            var entity = await _context.order_items.FirstOrDefaultAsync(i => i.id == itemId);
            if (entity is null) return NotFound();
            if (entity.order_id != orderId)
                return Conflict(new { message = "Позиция не принадлежит этому заказу" });

            _context.order_items.Remove(entity);
            await _context.SaveChangesAsync();

            await _context.Database.ExecuteSqlRawAsync("SELECT pizzeria.sync_order_total({0})", orderId);
            return NoContent();
        }
    }
}