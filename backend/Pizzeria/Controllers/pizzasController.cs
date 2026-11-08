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
    [Route("api/[controller]")]
    [ApiController]
    public class pizzasController : ControllerBase
    {
        private readonly PizzeriaContext _context;

        public pizzasController(PizzeriaContext context)
        {
            _context = context;
        }

        // GET: api/pizzas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<pizza>>> Getpizzas()
        {
            return await _context.pizzas.ToListAsync();
        }

        // GET: api/pizzas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<pizza>> Getpizza(int id)
        {
            var pizza = await _context.pizzas.FindAsync(id);

            if (pizza == null)
            {
                return NotFound();
            }

            return pizza;
        }

        // PUT: api/pizzas/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> Putpizza(int id, pizza pizza)
        {
            if (id != pizza.id)
            {
                return BadRequest();
            }

            _context.Entry(pizza).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!pizzaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/pizzas
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<pizza>> Postpizza(pizza pizza)
        {
            _context.pizzas.Add(pizza);
            await _context.SaveChangesAsync();

            return CreatedAtAction("Getpizza", new { id = pizza.id }, pizza);
        }


        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.pizzas.FindAsync(id);
            if (entity is null)
                return NotFound();

            var inMenu = await _context.Set<menu>().AnyAsync(m => m.pizza_id == id);
            var inOrderItems = await _context.Set<order_item>().AnyAsync(oi => oi.pizza_id == id);
            var inRecipes = await _context.Set<pizza_recipe>().AnyAsync(r => r.pizza_id == id);

            if (inMenu || inOrderItems || inRecipes)
            {
                return Conflict(new
                {
                    message = "Удаление запрещено: существуют связанные записи.",
                    details = new { inMenu, inOrderItems, inRecipes }
                });
            }

            _context.pizzas.Remove(entity);

            try
            {
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "Удаление запрещено: появилась связанная запись. Повторите позже."
                });
            }
        }

        private bool pizzaExists(int id)
        {
            return _context.pizzas.Any(e => e.id == id);
        }
    }
}
