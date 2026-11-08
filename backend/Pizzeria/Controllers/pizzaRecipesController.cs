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
    [Route("api/pizzas/{pizzaId:int}/recipe")]
    public class pizzaRecipesController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public pizzaRecipesController(PizzeriaContext context) => _context = context;

        // DTO
        public record AddItemDto(int ingredient_id, string quantity);
        public record UpdateItemDto(string quantity);

        // GET /api/pizzas/{pizzaId}/recipe
        [HttpGet]
        public async Task<IActionResult> Get(int pizzaId)
        {
            var pizzaExists = await _context.Set<pizza>().AnyAsync(p => p.id == pizzaId);
            if (!pizzaExists) return NotFound(new { message = "Пицца не найдена" });

            var items = await (
                from r in _context.Set<pizza_recipe>().AsNoTracking()
                where r.pizza_id == pizzaId
                join ing in _context.Set<ingredient>().AsNoTracking()
                    on r.ingredient_id equals ing.id
                orderby ing.name
                select new
                {
                    r.pizza_id,
                    r.ingredient_id,
                    ingredient_name = ing.name,
                    r.quantity
                })
                .ToListAsync();

            return Ok(new { pizza_id = pizzaId, items });
        }

        // POST /api/pizzas/{pizzaId}/recipe/items
        [HttpPost("items")]
        public async Task<IActionResult> Add(int pizzaId, [FromBody] AddItemDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.quantity))
                return BadRequest(new { message = "quantity обязателен" });

            var pizza = await _context.Set<pizza>().FindAsync(pizzaId);
            if (pizza is null) return NotFound(new { message = "Пицца не найдена" });

            var ingExists = await _context.Set<ingredient>().AnyAsync(i => i.id == dto.ingredient_id);
            if (!ingExists) return Conflict(new { message = "Ингредиент не найден" });

            var duplicate = await _context.Set<pizza_recipe>()
                .AnyAsync(r => r.pizza_id == pizzaId && r.ingredient_id == dto.ingredient_id);
            if (duplicate) return Conflict(new { message = "Этот ингредиент уже есть в рецепте" });

            var entity = new pizza_recipe
            {
                pizza_id = pizzaId,
                ingredient_id = dto.ingredient_id,
                quantity = dto.quantity.Trim()
            };

            _context.Set<pizza_recipe>().Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { pizzaId = pizzaId }, new
            {
                entity.pizza_id,
                entity.ingredient_id,
                entity.quantity
            });
        }

        // PUT /api/pizzas/{pizzaId}/recipe/items/{ingredientId}
        [HttpPut("items/{ingredientId:int}")]
        public async Task<IActionResult> Update(int pizzaId, int ingredientId, [FromBody] UpdateItemDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.quantity))
                return BadRequest(new { message = "quantity обязателен" });

            var entity = await _context.Set<pizza_recipe>()
                .FirstOrDefaultAsync(r => r.pizza_id == pizzaId && r.ingredient_id == ingredientId);

            if (entity is null) return NotFound();

            entity.quantity = dto.quantity.Trim();
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/pizzas/{pizzaId}/recipe/items/{ingredientId}
        [HttpDelete("items/{ingredientId:int}")]
        public async Task<IActionResult> Delete(int pizzaId, int ingredientId)
        {
            var entity = await _context.Set<pizza_recipe>()
                .FirstOrDefaultAsync(r => r.pizza_id == pizzaId && r.ingredient_id == ingredientId);

            if (entity is null) return NotFound();

            _context.Set<pizza_recipe>().Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
