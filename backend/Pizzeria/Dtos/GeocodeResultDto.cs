namespace Pizzeria.Models;

public class GeocodeResultDto
{
    public string lat { get; set; } = "";
    public string lon { get; set; } = "";
    public string display_name { get; set; } = "";
    public string? type { get; set; }
    public double? importance { get; set; }

}
