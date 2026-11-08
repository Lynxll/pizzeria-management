using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class reviewsController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public reviewsController(PizzeriaContext context) => _context = context;

        public record CreateReviewDto(int order_id, int rating, string? comment);
        public record UpdateReviewDto(int rating, string? comment);

        // GET /api/reviews?orderId=123
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? orderId)
        {
            var q = _context.reviews
                .Include(r => r.order)
                    .ThenInclude(o => o.customer)
                .AsNoTracking()
                .Where(r => r.is_approved);

            if (orderId.HasValue)
                q = q.Where(r => r.order_id == orderId.Value);

            var list = await q
                .OrderByDescending(r => r.id)
                .Select(r => new
                {
                    r.id,
                    r.order_id,
                    r.rating,
                    r.comment,
                    customer_id = (int?)r.order.customer.id,
                    customer_name = r.order.customer.name
                })
                .ToListAsync();

            return Ok(list);
        }

        // GET /api/reviews/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.reviews
                .Include(r => r.order)
                    .ThenInclude(o => o.customer)
                .AsNoTracking()
                .Where(r => r.is_approved && r.id == id)
                .Select(r => new
                {
                    r.id,
                    r.order_id,
                    r.rating,
                    r.comment,
                    customer_id = (int?)r.order.customer.id,
                    customer_name = r.order.customer.name
                })
                .FirstOrDefaultAsync();

            return item is null ? NotFound() : Ok(item);
        }

        // POST /api/reviews
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReviewDto dto)
        {
            if (dto.rating < 1 || dto.rating > 5)
                return BadRequest(new { message = "rating должен быть от 1 до 5" });

            var orderExists = await _context.orders.AnyAsync(o => o.id == dto.order_id);
            if (!orderExists)
                return Conflict(new { message = "Заказ не найден" });

            var already = await _context.reviews.AnyAsync(r => r.order_id == dto.order_id);
            if (already)
                return Conflict(new { message = "Для этого заказа отзыв уже существует" });

            var entity = new review
            {
                order_id = dto.order_id,
                rating = dto.rating,
                comment = string.IsNullOrWhiteSpace(dto.comment) ? null : dto.comment!.Trim(),
                is_approved = false // новый отзыв идёт на модерацию
            };

            _context.reviews.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.id }, entity);
        }

        // PUT /api/reviews/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateReviewDto dto)
        {
            if (dto.rating < 1 || dto.rating > 5)
                return BadRequest(new { message = "rating должен быть от 1 до 5" });

            var entity = await _context.reviews.FindAsync(id);
            if (entity is null) return NotFound();

            entity.rating = dto.rating;
            entity.comment = string.IsNullOrWhiteSpace(dto.comment) ? null : dto.comment!.Trim();
            // is_approved здесь не трогаем

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/reviews/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.reviews.FindAsync(id);
            if (entity is null) return NotFound();

            _context.reviews.Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
