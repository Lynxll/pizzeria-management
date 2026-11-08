using System.Collections.Concurrent;
using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Pizzeria.Services;

public sealed class GraphHopperCourierRouteService : IGraphHopperCourierRouteService
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> RouteKeyLocks = new();

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly GraphHopperOptions _opt;
    private readonly ILogger<GraphHopperCourierRouteService> _logger;

    private static readonly JsonSerializerOptions JsonWrite = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = null
    };

    public GraphHopperCourierRouteService(
        HttpClient http,
        IMemoryCache cache,
        IOptions<GraphHopperOptions> options,
        ILogger<GraphHopperCourierRouteService> logger)
    {
        _http = http;
        _cache = cache;
        _opt = options.Value;
        _logger = logger;
    }

    public async Task<CourierRoadRoute> BuildInProgressRouteAsync(
        double originLat,
        double originLng,
        IReadOnlyList<CourierRouteStop> inProgressStops,
        CancellationToken cancellationToken = default)
    {
        if (inProgressStops.Count == 0)
            return new CourierRoadRoute(Array.Empty<int>(), null, null);

        var fallbackOrder = inProgressStops.Select(s => s.DeliveryId).ToList();

        var apiKey = (_opt.ApiKey ?? "").Trim();
        if (string.IsNullOrEmpty(apiKey))
            return new CourierRoadRoute(fallbackOrder, null, "Ключ GraphHopper не задан (user-secrets GraphHopper:ApiKey или переменная GraphHopper__ApiKey).");

        var cacheKey = BuildRouteCacheKey(originLat, originLng, inProgressStops);
        if (_cache.TryGetValue(cacheKey, out CourierRoadRoute? cached) && cached is not null)
            return cached;

        var gate = RouteKeyLocks.GetOrAdd(cacheKey, static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_cache.TryGetValue(cacheKey, out cached) && cached is not null)
                return cached;

            var stops = inProgressStops.ToList();
            string? capWarning = null;
            if (stops.Count > _opt.MaxStopsPerOptimization)
            {
                capWarning = $"Оптимизация только для первых {_opt.MaxStopsPerOptimization} заказов (лимит настроек).";
                stops = stops.Take(_opt.MaxStopsPerOptimization).ToList();
            }

            var minVrp = Math.Clamp(_opt.MinStopsForVrp, 1, 10);
            List<int> orderedIds;
            string? vrpWarning = null;
            if (stops.Count < minVrp)
            {
                orderedIds = fallbackOrder.ToList();
                _logger.LogDebug(
                    "GraphHopper VRP пропущен: остановок {Count} < MinStopsForVrp {Min} (экономия кредитов Free tier).",
                    stops.Count,
                    minVrp);
            }
            else
            {
                try
                {
                    var (fromVrp, vrpErr) = await SolveVrpOrderAsync(apiKey, originLat, originLng, stops, cancellationToken).ConfigureAwait(false);
                    if (fromVrp is { Count: > 0 })
                        orderedIds = fromVrp;
                    else
                    {
                        orderedIds = fallbackOrder.ToList();
                        vrpWarning = fromVrp is null
                            ? Concat(
                                "VRP недоступен или ответ не распознан; порядок — по времени «Взять».",
                                vrpErr)
                            : "VRP вернул пустой порядок; используется порядок по времени «Взять».";
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "GraphHopper VRP исключение; порядок по времени «Взять».");
                    orderedIds = fallbackOrder.ToList();
                    vrpWarning = "Ошибка VRP; порядок по времени «Взять».";
                }
            }

            foreach (var id in fallbackOrder)
            {
                if (!orderedIds.Contains(id))
                    orderedIds.Add(id);
            }

            var byId = stops.ToDictionary(s => s.DeliveryId, s => s);
            var waypoints = new List<(double Lat, double Lng)> { (originLat, originLng) };
            foreach (var id in orderedIds)
            {
                if (byId.TryGetValue(id, out var s))
                    waypoints.Add((s.Lat, s.Lng));
            }

            IReadOnlyList<RoutePathPoint>? path = null;
            string? routeErr = null;
            try
            {
                (path, routeErr) = await FetchRoadPathAsync(apiKey, waypoints, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "GraphHopper Route API недоступен, без полилинии.");
            }

            var warn = Concat(
                Concat(capWarning, vrpWarning),
                path is null
                    ? Concat("Линия по дорогам недоступна (Route API).", routeErr)
                    : null);
            var result = new CourierRoadRoute(orderedIds, path, warn);

            var ttl = Math.Clamp(_opt.RouteCacheSeconds, 30, 600);
            _cache.Set(cacheKey, result, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttl)
            });

            return result;
        }
        finally
        {
            gate.Release();
        }
    }

    public async Task<(IReadOnlyList<RoutePathPoint>? Path, string? Warning)> BuildReturnToPizzeriaRouteAsync(
        double fromLat,
        double fromLng,
        double pizzeriaLat,
        double pizzeriaLng,
        CancellationToken cancellationToken = default)
    {
        var apiKey = (_opt.ApiKey ?? "").Trim();
        if (string.IsNullOrEmpty(apiKey))
            return (null, "Ключ GraphHopper не задан (user-secrets GraphHopper:ApiKey или переменная GraphHopper__ApiKey).");

        var ci = CultureInfo.InvariantCulture;
        var cacheKey =
            $"gh:return:{fromLat.ToString("F5", ci)}:{fromLng.ToString("F5", ci)}:" +
            $"{pizzeriaLat.ToString("F5", ci)}:{pizzeriaLng.ToString("F5", ci)}";

        if (_cache.TryGetValue(cacheKey, out ReturnRouteCache? retCached) && retCached is not null)
            return (retCached.Path, retCached.Warning);

        var gate = RouteKeyLocks.GetOrAdd(cacheKey, static _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_cache.TryGetValue(cacheKey, out retCached) && retCached is not null)
                return (retCached.Path, retCached.Warning);

            var waypoints = new List<(double Lat, double Lng)>
            {
                (fromLat, fromLng),
                (pizzeriaLat, pizzeriaLng)
            };

            IReadOnlyList<RoutePathPoint>? path = null;
            string? routeErr = null;
            try
            {
                (path, routeErr) = await FetchRoadPathAsync(apiKey, waypoints, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "GraphHopper Route API (возврат на базу) недоступен.");
            }

            var warning = path is null
                ? Concat("Линия «до пиццерии» по дорогам недоступна (Route API).", routeErr)
                : null;

            var entry = new ReturnRouteCache(path, warning);
            var ttl = Math.Clamp(_opt.RouteCacheSeconds, 30, 600);
            _cache.Set(cacheKey, entry, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttl)
            });

            return (path, warning);
        }
        finally
        {
            gate.Release();
        }
    }

    private sealed record ReturnRouteCache(IReadOnlyList<RoutePathPoint>? Path, string? Warning);

    private static string BuildRouteCacheKey(double originLat, double originLng, IReadOnlyList<CourierRouteStop> stops)
    {
        var ci = CultureInfo.InvariantCulture;
        var tail = string.Join(
            '|',
            stops
                .OrderBy(s => s.DeliveryId)
                .Select(s =>
                    $"{s.DeliveryId.ToString(ci)}:{s.Lat.ToString("F6", ci)}:{s.Lng.ToString("F6", ci)}"));
        return $"gh:{originLat.ToString("F5", ci)}:{originLng.ToString("F5", ci)}:{tail}";
    }

    private async Task<(List<int>? order, string? errorHint)> SolveVrpOrderAsync(
        string apiKey,
        double originLat,
        double originLng,
        IReadOnlyList<CourierRouteStop> stops,
        CancellationToken cancellationToken)
    {
        var body = new GhVrpRequest
        {
            objectives =
            [
                new GhObjective { type = "min", value = "completion_time" }
            ],
            vehicles =
            [
                new GhVehicle
                {
                    vehicle_id = "courier",
                    return_to_depot = false,
                    shifts =
                    [
                        new GhShift
                        {
                            shift_id = "shift-1",
                            start_address = new GhAddress
                            {
                                location_id = "pizzeria_origin",
                                lat = originLat,
                                lon = originLng
                            }
                        }
                    ]
                }
            ],
            services = stops.Select(s => new GhService
            {
                id = s.DeliveryId.ToString(CultureInfo.InvariantCulture),
                type = "service",
                address = new GhAddress
                {
                    location_id = $"delivery_{s.DeliveryId}",
                    lat = s.Lat,
                    lon = s.Lng
                }
            }).ToList()
        };

        var baseUrl = _opt.BaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/vrp?key={Uri.EscapeDataString(apiKey)}";

        using var response = await _http.PostAsJsonAsync(url, body, JsonWrite, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("GraphHopper VRP HTTP {Code}: {Body}", (int)response.StatusCode, Truncate(json, 800));
            return (null, TryGraphHopperMessage(json));
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.TryGetProperty("status", out var st) && st.GetString() is { } status && status != "finished")
        {
            _logger.LogWarning("GraphHopper VRP status: {Status}", status);
            return (null, $"Статус VRP: {status}.");
        }

        if (!root.TryGetProperty("solution", out var solution))
            return (null, "В ответе VRP нет solution.");

        if (solution.TryGetProperty("no_unassigned", out var nu) && nu.TryGetInt32(out var unassigned) && unassigned > 0)
            _logger.LogWarning("GraphHopper VRP: no_unassigned={Unassigned}", unassigned);

        if (!solution.TryGetProperty("routes", out var routes) || routes.GetArrayLength() == 0)
            return (null, "В solution нет routes.");

        var order = new List<int>();
        foreach (var act in routes[0].GetProperty("activities").EnumerateArray())
        {
            if (!act.TryGetProperty("type", out var typeEl))
                continue;
            var type = typeEl.GetString();
            if (type is not ("service" or "pickupShipment" or "deliverShipment" or "pickup" or "delivery"))
                continue;

            if (!act.TryGetProperty("id", out var idEl))
                continue;
            var sid = idEl.GetString();
            if (sid is null || !int.TryParse(sid, NumberStyles.Integer, CultureInfo.InvariantCulture, out var deliveryId))
                continue;
            order.Add(deliveryId);
        }

        return order.Count > 0 ? (order, null) : (null, "В маршруте VRP нет activities типа service.");
    }

    private async Task<(IReadOnlyList<RoutePathPoint>? path, string? errorHint)> FetchRoadPathAsync(
        string apiKey,
        IReadOnlyList<(double Lat, double Lng)> waypoints,
        CancellationToken cancellationToken)
    {
        if (waypoints.Count < 2)
            return (null, null);

        var qs = new List<string>
        {
            $"profile={Uri.EscapeDataString(_opt.VehicleProfile)}",
            "points_encoded=false",
            "locale=ru",
            $"key={Uri.EscapeDataString(apiKey)}"
        };
        foreach (var (lat, lng) in waypoints)
        {
            qs.Add(
                $"point={Uri.EscapeDataString(lat.ToString(CultureInfo.InvariantCulture))}," +
                Uri.EscapeDataString(lng.ToString(CultureInfo.InvariantCulture)));
        }

        var baseUrl = _opt.BaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/route?{string.Join("&", qs)}";

        using var response = await _http.GetAsync(url, cancellationToken).ConfigureAwait(false);
        var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("GraphHopper Route HTTP {Code}: {Body}", (int)response.StatusCode, Truncate(json, 400));
            return (null, TryGraphHopperMessage(json));
        }

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("paths", out var paths) || paths.GetArrayLength() == 0)
            return (null, TryGraphHopperMessage(json));

        var pts = paths[0].GetProperty("points");
        JsonElement coords;
        if (pts.ValueKind == JsonValueKind.Object && pts.TryGetProperty("coordinates", out coords))
        {
            // GeoJSON LineString
        }
        else if (pts.ValueKind == JsonValueKind.Array)
            coords = pts;
        else
            return (null, "Неизвестный формат paths[0].points.");

        var list = new List<RoutePathPoint>();
        foreach (var pair in coords.EnumerateArray())
        {
            var arr = pair.EnumerateArray().ToArray();
            if (arr.Length < 2) continue;
            var lon = arr[0].GetDouble();
            var lat = arr[1].GetDouble();
            list.Add(new RoutePathPoint(lat, lon));
        }

        return list.Count > 0 ? (list, null) : (null, "Пустая геометрия в ответе Route API.");
    }

    private static string? TryGraphHopperMessage(string json)
    {
        try
        {
            using var d = JsonDocument.Parse(json);
            if (d.RootElement.TryGetProperty("message", out var m))
                return m.GetString();
        }
        catch
        {
            /* ignore */
        }

        return null;
    }

    private static string? Concat(string? a, string? b)
    {
        if (string.IsNullOrEmpty(a)) return b;
        if (string.IsNullOrEmpty(b)) return a;
        return $"{a} {b}";
    }

    private static string Truncate(string s, int max)
        => s.Length <= max ? s : s[..max] + "…";

    private sealed class GhVrpRequest
    {
        public List<GhObjective>? objectives { get; init; }
        public List<GhVehicle> vehicles { get; init; } = null!;
        public List<GhService> services { get; init; } = null!;
    }

    private sealed class GhObjective
    {
        public string type { get; init; } = null!;
        public string value { get; init; } = null!;
    }

    private sealed class GhVehicle
    {
        public string vehicle_id { get; init; } = null!;
        public bool return_to_depot { get; init; }
        public List<GhShift> shifts { get; init; } = null!;
    }

    private sealed class GhShift
    {
        public string shift_id { get; init; } = null!;
        public GhAddress start_address { get; init; } = null!;
    }

    private sealed class GhService
    {
        public string id { get; init; } = null!;
        public string type { get; init; } = null!;
        public GhAddress address { get; init; } = null!;
    }

    private sealed class GhAddress
    {
        public string location_id { get; init; } = null!;
        public double lat { get; init; }
        public double lon { get; init; }
    }
}
