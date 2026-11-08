using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly PizzeriaContext _db;

    public DashboardController(PizzeriaContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var totalOrders = await _db.orders.CountAsync();

        var todayOrders = await _db.orders
            .CountAsync(o => o.order_date >= today && o.order_date < tomorrow);

        var deliveredToday = await _db.orders
            .CountAsync(o =>
                o.order_date >= today &&
                o.order_date < tomorrow &&
                o.Status == OrderStatus.Delivered);

        var activeStatuses = new[] { OrderStatus.Accepted, OrderStatus.Cooking, OrderStatus.InTransit };
        var activeOrders = await _db.orders
            .CountAsync(o => activeStatuses.Contains(o.Status));

        int pendingReviews = 0;
        if (_db.reviews != null)
        {

            pendingReviews = await _db.reviews
                .CountAsync(r => !r.is_approved);
        }

        return Ok(new
        {
            totalOrders,
            todayOrders,
            deliveredToday,
            activeOrders,
            pendingReviews
        });
    }
}
