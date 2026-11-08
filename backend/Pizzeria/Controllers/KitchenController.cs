using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Cook")]
public class KitchenController : ControllerBase
{
    private readonly PizzeriaContext _context;

    public KitchenController(PizzeriaContext context)
    {
        _context = context;
    }

    public record KitchenItemDto(
        int order_item_id,
        int order_id,
        string pizza_name,
        int quantity,
        DateTime assigned_at,
        int waiting_seconds,
        OrderItemStatus status   
    );

    public record KitchenSummaryDto(
        string pizza_name,
        int total_qty
    );

    public record KitchenDashboardDto(
        List<KitchenItemDto> items,
        List<KitchenSummaryDto> summary
    );

    // GET /api/kitchen/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var baseQuery = _context.order_items
            .Include(oi => oi.order)
            .Include(oi => oi.pizza)
            .Where(oi =>
                oi.order != null &&
                oi.pizza != null &&
                (oi.order.Status == OrderStatus.Accepted ||
                 oi.order.Status == OrderStatus.Cooking))
            .AsNoTracking();

        var raw = await baseQuery
            .OrderBy(oi => oi.order!.order_date)
            .Select(oi => new
            {
                oi.id,
                oi.order_id,
                pizza_name = oi.pizza!.name,
                oi.quantity,
                order_date = oi.order!.order_date,
                status = oi.Status
            })
            .ToListAsync();

        var now = DateTime.Now;

        var items = raw
            .Select(r => new KitchenItemDto(
                r.id,                         
                r.order_id,                   
                r.pizza_name,                
                r.quantity,                  
                r.order_date,                
                (int)(now - r.order_date).TotalSeconds, 
                r.status                    
            ))
            .ToList();

        var summary = raw
          .Where(r => r.status == OrderItemStatus.InKitchen)   
          .GroupBy(r => r.pizza_name)
          .Select(g => new KitchenSummaryDto(
              g.Key,
              g.Sum(x => x.quantity)
          ))
          .OrderBy(row => row.pizza_name)
          .ToList();

        return Ok(new KitchenDashboardDto(items, summary));
    }


    // POST /api/kitchen/items/{orderItemId}/mark-cooked
    [HttpPost("items/{orderItemId:int}/mark-cooked")]
    public async Task<IActionResult> MarkItemCooked([FromRoute] int orderItemId)
    {
        var item = await _context.order_items
            .Include(oi => oi.order)
            .FirstOrDefaultAsync(oi => oi.id == orderItemId);

        if (item == null)
            return NotFound(new { message = "Позиция заказа не найдена." });

        if (item.order == null)
            return BadRequest(new { message = "У позиции нет связанного заказа." });

        if (item.order.Status != OrderStatus.Accepted &&
            item.order.Status != OrderStatus.Cooking)
        {
            return BadRequest(new { message = "Нельзя готовить позицию этого заказа." });
        }

        if (item.Status != OrderItemStatus.InKitchen)
        {
            return BadRequest(new { message = $"Позиция уже имеет статус '{item.Status}'." });
        }

        item.Status = OrderItemStatus.Cooked;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = item.id,
            order_id = item.order_id,
            status = item.Status.ToString()
        });
    }

}
