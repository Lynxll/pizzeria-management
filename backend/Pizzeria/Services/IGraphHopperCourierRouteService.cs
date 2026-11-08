namespace Pizzeria.Services;

public sealed record CourierRouteStop(int DeliveryId, double Lat, double Lng);

public sealed record CourierRoadRoute(
    IReadOnlyList<int> OrderedDeliveryIds,
    IReadOnlyList<RoutePathPoint>? Path,
    string? Warning
);

public readonly record struct RoutePathPoint(double Lat, double Lng);

public interface IGraphHopperCourierRouteService
{
    Task<CourierRoadRoute> BuildInProgressRouteAsync(
        double originLat,
        double originLng,
        IReadOnlyList<CourierRouteStop> inProgressStops,
        CancellationToken cancellationToken = default);

    /// <summary>Полилиния по дорогам от последней точки до пиццерии (только Route API, без VRP).</summary>
    Task<(IReadOnlyList<RoutePathPoint>? Path, string? Warning)> BuildReturnToPizzeriaRouteAsync(
        double fromLat,
        double fromLng,
        double pizzeriaLat,
        double pizzeriaLng,
        CancellationToken cancellationToken = default);
}
