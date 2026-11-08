using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class MenuController : ControllerBase
{
    private readonly PizzeriaContext _db;

    public MenuController(PizzeriaContext db)
    {
        _db = db;
    }

    public record MenuPizzaDto(
        int id,             
        int pizza_id,
        string name,
        string? description,
        decimal price,
        bool is_active
    );

    public record MenuPizzaCreateDto(
        string name,
        string? description,
        decimal price,
        bool is_active
    );

    public record MenuPizzaUpdateDto(
        string name,
        string? description,
        decimal price,
        bool is_active
    );

    // GET: /api/admin/menu
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.menus
            .Include(m => m.pizza)
            .AsNoTracking()
            .Select(m => new MenuPizzaDto(
                m.id,
                m.pizza_id,
                m.pizza.name,
                m.pizza.description,
                m.price,
                m.is_active
            ))
            .ToListAsync();

        return Ok(items);
    }

    // POST: /api/admin/menu
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MenuPizzaCreateDto dto)
    {
        var pizza = new pizza
        {
            name = dto.name,
            description = dto.description,
            cost_price = 0m
        };
        _db.pizzas.Add(pizza);
        await _db.SaveChangesAsync();

        var menu = new menu
        {
            pizza_id = pizza.id,
            price = dto.price,
            is_active = dto.is_active
        };
        _db.menus.Add(menu);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = menu.id }, new { menu.id });
    }

    // PUT: /api/admin/menu/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MenuPizzaUpdateDto dto)
    {
        var menu = await _db.menus
            .Include(m => m.pizza)
            .FirstOrDefaultAsync(m => m.id == id);

        if (menu is null) return NotFound();

        menu.pizza.name = dto.name;
        menu.pizza.description = dto.description;

        menu.price = dto.price;
        menu.is_active = dto.is_active;

        await _db.SaveChangesAsync();
        return NoContent();
    }
}
