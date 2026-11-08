using Microsoft.AspNetCore.Mvc;
using Pizzeria.Models;

[ApiController]
[Route("api/geocode")]
public class GeocodeController : ControllerBase
{
    private readonly IGeocodingService _geo;

    public GeocodeController(IGeocodingService geo)
    {
        _geo = geo;
    }

    [HttpGet]
    public async Task<IActionResult> Geocode([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(new { message = "query is required" });

        try
        {
            var results = await _geo.GeocodeAsync(query);

            return Ok(new
            {
                status = results.Count == 0 ? GeocodeStatus.NotFound
                      : results.Count == 1 ? GeocodeStatus.Ok
                      : GeocodeStatus.Ambiguous,
                results
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Geocode failed",
                error = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }

}
