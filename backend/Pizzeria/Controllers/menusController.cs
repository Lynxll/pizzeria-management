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
    [Route("api/[controller]")]
    public class menusController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public menusController(PizzeriaContext context) => _context = context;

        // DTOшки
        public record CreateMenuDto(int pizza_id, decimal price, bool? is_active);
        public record UpdateMenuDto(decimal price, bool? is_active);

        // GET /api/menu?active=true|false (опционально)
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] bool? active)
        {
            var q = _context.Set<menu>().AsNoTracking();

            if (active.HasValue)
                q = q.Where(m => m.is_active == active.Value);

            var items = await q
                .OrderBy(m => m.id)
                .Select(m => new
                {
                    m.id,
                    m.pizza_id,
                    m.price,
                    m.is_active
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET /api/menu/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _context.Set<menu>().AsNoTracking()
                .FirstOrDefaultAsync(m => m.id == id);
            return item is null ? NotFound() : Ok(item);
        }

        // POST /api/menu
   
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMenuDto dto)
        {
            var pizzaExists = await _context.Set<pizza>().AnyAsync(p => p.id == dto.pizza_id);
            if (!pizzaExists)
                return Conflict(new { message = "Пицца не найдена" });

            var already = await _context.Set<menu>().AnyAsync(m => m.pizza_id == dto.pizza_id);
            if (already)
                return Conflict(new { message = "Для этой пиццы уже существует позиция меню" });

            if (dto.price <= 0)
                return BadRequest(new { message = "Цена должна быть > 0" });

            var entity = new menu
            {
                pizza_id = dto.pizza_id,
                price = dto.price,
                is_active = dto.is_active ?? true
            };

            _context.Set<menu>().Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.id }, entity);
        }

        // PUT /api/menu/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuDto dto)
        {
            var entity = await _context.Set<menu>().FindAsync(id);
            if (entity is null) return NotFound();

            if (dto.price <= 0)
                return BadRequest(new { message = "Цена должна быть > 0" });

            entity.price = dto.price;
            if (dto.is_active.HasValue) entity.is_active = dto.is_active.Value;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST /api/menu/{id}/activate
        [HttpPost("{id:int}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var entity = await _context.Set<menu>().FindAsync(id);
            if (entity is null) return NotFound();

            if (!entity.is_active)
            {
                entity.is_active = true;
                await _context.SaveChangesAsync();
            }
            return Ok(new { id = entity.id, entity.is_active });
        }

        // POST /api/menu/{id}/deactivate
        [HttpPost("{id:int}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var entity = await _context.Set<menu>().FindAsync(id);
            if (entity is null) return NotFound();

            if (entity.is_active)
            {
                entity.is_active = false;
                await _context.SaveChangesAsync();
            }
            return Ok(new { id = entity.id, entity.is_active });
        }

        //DELETE /api/menu/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Set<menu>().FindAsync(id);
            if (entity is null) return NotFound();

            _context.Set<menu>().Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}