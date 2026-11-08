using Pizzeria.Models;

public interface IGeocodingService
{
    Task<List<GeocodeResultDto>> GeocodeAsync(string query, CancellationToken ct = default);
}
