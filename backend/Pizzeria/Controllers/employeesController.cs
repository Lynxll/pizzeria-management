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
    public class employeesController : ControllerBase
    {
        private readonly PizzeriaContext _context;
        public employeesController(PizzeriaContext context) => _context = context;

        // GET /api/employees?role=Courier
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] EmployeeRole? role)
        {
            var q = _context.Set<employee>().AsNoTracking();
            if (role.HasValue) q = q.Where(e => e.Role == role.Value);

            var items = await q
                .OrderBy(e => e.id)
                .Select(e => new { e.id, e.name, role = e.Role.ToString() })
                .ToListAsync();

            return Ok(items);
        }

        // GET /api/employees/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var e = await _context.Set<employee>().AsNoTracking().FirstOrDefaultAsync(x => x.id == id);
            return e is null ? NotFound() : Ok(e);
        }

        public record CreateEmployeeDto(string name, EmployeeRole role);
        public record UpdateEmployeeDto(string name, EmployeeRole role);

        // POST /api/employees
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.name))
                return BadRequest(new { message = "Имя обязательно" });

            var entity = new employee { name = dto.name.Trim(), Role = dto.role };
            _context.Set<employee>().Add(entity);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.id }, entity);
        }

        // PUT /api/employees/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var entity = await _context.Set<employee>().FindAsync(id);
            if (entity is null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.name))
                return BadRequest(new { message = "Имя обязательно" });

            entity.name = dto.name.Trim();
            entity.Role = dto.role;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE /api/employees/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Set<employee>().FindAsync(id);
            if (entity is null) return NotFound();

            _context.Set<employee>().Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
