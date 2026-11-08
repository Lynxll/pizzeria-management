namespace Pizzeria.Services;

public sealed class GraphHopperOptions
{
    public const string SectionName = "GraphHopper";

    public string BaseUrl { get; set; } = "https://graphhopper.com/api/1";

    public string ApiKey { get; set; } = "";

    public double PizzeriaLat { get; set; }

    public double PizzeriaLng { get; set; }

    public string VehicleProfile { get; set; } = "car";

    public int MaxStopsPerOptimization { get; set; } = 4;

    /// <summary>
    /// VRP (Route Optimization API) стоит минимум ~10 кредитов за запрос. При меньшем числе остановок
    /// порядок берётся как в списке (хронология «Взять»), вызывается только Route API (~1 кредит).
    /// </summary>
    public int MinStopsForVrp { get; set; } = 3;

    public int RouteCacheSeconds { get; set; } = 120;
}
