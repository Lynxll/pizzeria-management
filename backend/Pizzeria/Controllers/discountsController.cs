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
    public class discountsController : ControllerBase
    {
        private readonly PizzeriaContext _context;

        public discountsController(PizzeriaContext context)
        {
            _context = context;
        }

        // GET: api/discounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<discount>>> Getdiscounts()
        {
            return await _context.discounts.ToListAsync();
        }

        // GET: api/discounts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<discount>> Getdiscount(int id)
        {
            var discount = await _context.discounts.FindAsync(id);

            if (discount == null)
            {
                return NotFound();
            }

            return discount;
        }

        // PUT: api/discounts/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> Putdiscount(int id, discount discount)
        {
            if (id != discount.id)
            {
                return BadRequest();
            }

            _context.Entry(discount).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!discountExists(id))
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

        // POST: api/discounts
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<discount>> Postdiscount(discount discount)
        {
            _context.discounts.Add(discount);
            await _context.SaveChangesAsync();

            return CreatedAtAction("Getdiscount", new { id = discount.id }, discount);
        }

        // DELETE: api/discounts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletediscount(int id)
        {
            var discount = await _context.discounts.FindAsync(id);
            if (discount == null)
            {
                return NotFound();
            }

            _context.discounts.Remove(discount);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool discountExists(int id)
        {
            return _context.discounts.Any(e => e.id == id);
        }
        [HttpGet("validate")]
        public async Task<IActionResult> Validate([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return Ok(new { valid = false, reason = "empty_code" });

            var normalized = code.Trim().ToUpperInvariant();

            var d = await _context.Set<discount>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.code != null && x.code.ToUpper() == normalized);

            if (d is null)
                return Ok(new { valid = false, reason = "not_found" });

            
            DateTime? expires = d.valid_until.HasValue
                ? d.valid_until.Value.ToDateTime(TimeOnly.MaxValue)
                : (DateTime?)null;

            if (expires.HasValue && expires.Value <= DateTime.UtcNow)
                return Ok(new { valid = false, reason = "expired", expiresAt = expires });

            return Ok(new
            {
                valid = true,
                type = d.type.ToString(), 
                value = d.value,
                code = d.code,
                expiresAt = expires         
            });
        }

    }
}
