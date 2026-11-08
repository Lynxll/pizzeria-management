using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pizzeria.Data;
using Pizzeria.Models;
using Pizzeria.Services;

namespace Pizzeria.Controllers;

[ApiController]
[Route("api/courier")]
[Authorize(Roles = "Courier")]
public class CourierMapController : ControllerBase
{
    private readonly PizzeriaContext _context;
    private readonly IGraphHopperCourierRouteService _routing;
    private readonly GraphHopperOptions _gh;

    public CourierMapController(
        PizzeriaContext context,
        IGraphHopperCourierRouteService routing,
        IOptions<GraphHopperOptions> ghOptions)
    {
        _context = context;
        _routing = routing;
        _gh = ghOptions.Value;
    }

    private async Task<employee?> GetCurrentCourier()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return null;

        return await _context.employees
            .FirstOrDefaultAsync(e => e.user_id == userId && e.Role == EmployeeRole.Courier);
    }

    public record CourierMapOrderDto(
        int delivery_id,
        int order_id,
        int? queue_position,
        string delivery_address,
        decimal delivery_lat,
        decimal delivery_lng,
        DeliveryStatus delivery_status,
        DateTime? ready_at,
        DateTime? start_time
    );

    [HttpGet("map")]
    public async Task<IActionResult> GetCourierMap(CancellationToken cancellationToken)
    {
        var courier = await GetCurrentCourier();
        if (courier is null) return Forbid();

        var baseQ = _context.Set<delivery>()
            .AsNoTracking()
            .Include(d => d.order)
            .Where(d =>
                d.courier_id == courier.id &&
                d.order != null &&
                d.order.delivery_lat != null &&
                d.order.delivery_lng != null);

        var available = await baseQ
            .Where(d => d.Status == DeliveryStatus.Assigned)
            .OrderBy(d => d.queue_position ?? int.MaxValue)
            .ThenBy(d => d.ready_at ?? d.start_time ?? DateTime.MaxValue)
            .Take(4)
            .Select(d => new CourierMapOrderDto(
                d.id,
                d.order_id,
                d.queue_position,
                d.order!.delivery_address,
                d.order!.delivery_lat!.Value,
                d.order!.delivery_lng!.Value,
                d.Status,
                d.ready_at,
                d.start_time
            ))
            .ToListAsync(cancellationToken);

        var routeChrono = await baseQ
            .Where(d => d.Status == DeliveryStatus.InProgress)
            .OrderBy(d => d.start_time ?? DateTime.MaxValue)
            .Select(d => new CourierMapOrderDto(
                d.id,
                d.order_id,
                d.queue_position,
                d.order!.delivery_address,
                d.order!.delivery_lat!.Value,
                d.order!.delivery_lng!.Value,
                d.Status,
                d.ready_at,
                d.start_time
            ))
            .ToListAsync(cancellationToken);

        IReadOnlyList<CourierMapOrderDto> routeOrdered = routeChrono;
        object? routePath = null;
        string? routingWarning = null;

        if (routeChrono.Count > 0)
        {
            var originLat = courier.route_anchor_lat is { } alat
                ? (double)alat
                : _gh.PizzeriaLat;
            var originLng = courier.route_anchor_lng is { } alng
                ? (double)alng
                : _gh.PizzeriaLng;

            var stops = routeChrono
                .Select(r => new CourierRouteStop(r.delivery_id, (double)r.delivery_lat, (double)r.delivery_lng))
                .ToList();

            var plan = await _routing.BuildInProgressRouteAsync(originLat, originLng, stops, cancellationToken)
                .ConfigureAwait(false);
            routingWarning = plan.Warning;

            var byId = routeChrono.ToDictionary(r => r.delivery_id);
            var ordered = new List<CourierMapOrderDto>();
            foreach (var id in plan.OrderedDeliveryIds)
            {
                if (byId.TryGetValue(id, out var dto))
                    ordered.Add(dto);
            }

            foreach (var r in routeChrono)
            {
                if (!ordered.Any(x => x.delivery_id == r.delivery_id))
                    ordered.Add(r);
            }

            routeOrdered = ordered;
            routePath = plan.Path?.Select(p => new { lat = p.Lat, lng = p.Lng }).ToList();
        }
        else if (courier.is_out_for_delivery &&
                 routeChrono.Count == 0 &&
                 available.Count == 0 &&
                 courier.route_anchor_lat is { } retLat &&
                 courier.route_anchor_lng is { } retLng)
        {
            var (path, warn) = await _routing.BuildReturnToPizzeriaRouteAsync(
                (double)retLat,
                (double)retLng,
                _gh.PizzeriaLat,
                _gh.PizzeriaLng,
                cancellationToken).ConfigureAwait(false);

            routingWarning = warn;
            routePath = path?.Select(p => new { lat = p.Lat, lng = p.Lng }).ToList();
        }

        return Ok(new
        {
            available,
            route = routeOrdered,
            route_path = routePath,
            routing_warning = routingWarning
        });
    }
}
