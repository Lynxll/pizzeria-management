using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class ReviewsController : ControllerBase
{
    private readonly PizzeriaContext _db;

    public ReviewsController(PizzeriaContext db)
    {
        _db = db;
    }

    // DTO для админки
    public record AdminReviewDto(
        int id,
        int order_id,
        string customer_name,
        DateTime order_date,
        int rating,
        string? comment,
        bool is_approved
    );

    // GET: /api/admin/reviews?onlyPending=true
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] bool onlyPending = true)
    {
        var q = _db.reviews
            .Include(r => r.order)
                .ThenInclude(o => o.customer)
            .AsNoTracking()
            .AsQueryable();

        if (onlyPending)
        {
            q = q.Where(r => !r.is_approved);
        }

        var list = await q
            .OrderByDescending(r => r.order.order_date)
            .Select(r => new AdminReviewDto(
                r.id,
                r.order_id,
                r.order.customer.name,
                r.order.order_date,
                r.rating,
                r.comment,
                r.is_approved
            ))
            .ToListAsync();

        return Ok(list);
    }

    // PUT: /api/admin/reviews/{id}/approve
    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var entity = await _db.Set<review>().FindAsync(id);
        if (entity is null) return NotFound();

        entity.is_approved = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: /api/admin/reviews/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Set<review>().FindAsync(id);
        if (entity is null) return NotFound();

        _db.Set<review>().Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
