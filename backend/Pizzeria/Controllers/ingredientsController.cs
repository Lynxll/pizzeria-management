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
    public class ingredientsController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public ingredientsController(PizzeriaContext context) => _context = context;

        // GET /api/ingredients?search=сыр
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? search)
        {
            var q = _context.Set<ingredient>().AsNoTracking();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                q = q.Where(i => i.name.ToLower().Contains(term));
            }

            var items = await q.OrderBy(i => i.id).ToListAsync();
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var i = await _context.Set<ingredient>().AsNoTracking().FirstOrDefaultAsync(x => x.id == id);
            return i is null ? NotFound() : Ok(i);
        }

        public record CreateIngredientDto(string name);
        public record UpdateIngredientDto(string name);

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIngredientDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.name))
                return BadRequest(new { message = "Название обязательно" });

            // уникальность имени по желанию
            var exists = await _context.Set<ingredient>().AnyAsync(i => i.name == dto.name);
            if (exists) return Conflict(new { message = "Такой ингредиент уже есть" });

            var entity = new ingredient { name = dto.name.Trim() };
            _context.Set<ingredient>().Add(entity);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.id }, entity);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateIngredientDto dto)
        {
            var entity = await _context.Set<ingredient>().FindAsync(id);
            if (entity is null) return NotFound();
            if (string.IsNullOrWhiteSpace(dto.name))
                return BadRequest(new { message = "Название обязательно" });

            entity.name = dto.name.Trim();
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Set<ingredient>().FindAsync(id);
            if (entity is null) return NotFound();

            _context.Set<ingredient>().Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}