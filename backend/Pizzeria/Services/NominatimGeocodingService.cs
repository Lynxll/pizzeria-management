using System.Net.Http.Headers;
using System.Text.Json;
using Pizzeria.Models;

public class NominatimGeocodingService : IGeocodingService
{
    private readonly HttpClient _http;

    public NominatimGeocodingService(HttpClient http)
    {
        _http = http;

        // ✅ Nominatim требует User-Agent
        if (_http.DefaultRequestHeaders.UserAgent.Count == 0)
        {
            _http.DefaultRequestHeaders.UserAgent.ParseAdd("PizzeriaMVP/1.0 (local dev)");
        }

        _http.DefaultRequestHeaders.Accept.Clear();
        _http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<List<GeocodeResultDto>> GeocodeAsync(string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            return new();

        var url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=jsonv2" +
            "&limit=5" +
            "&addressdetails=1" +
            $"&q={Uri.EscapeDataString(query)}";

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.UserAgent.ParseAdd("PizzeriaMVP/1.0 (local dev)"); // ✅ ещё раз на всякий

            using var resp = await _http.SendAsync(req, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
            {
                // ✅ чтобы контроллер не падал молча
                // можно залогировать body
                return new();
            }

            var res = JsonSerializer.Deserialize<List<GeocodeResultDto>>(
                body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            return res ?? new();
        }
        catch
        {
            // ✅ чтобы запрос /api/geocode не падал ERR_EMPTY_RESPONSE
            return new();
        }
    }
}
