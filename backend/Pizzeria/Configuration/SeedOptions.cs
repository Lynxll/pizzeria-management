namespace Pizzeria.Configuration;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public AdminSeedEntry Admin { get; init; } = new();

    public List<EmployeeSeedEntry> Couriers { get; init; } = new();

    public List<EmployeeSeedEntry> Cooks { get; init; } = new();

    public List<EmployeeSeedEntry> Collectors { get; init; } = new();
}

public sealed class AdminSeedEntry
{
    public string Email { get; init; } = "admin@pizzeria.local";

    public string Password { get; init; } = "";
}

public sealed class EmployeeSeedEntry
{
    public string Email { get; init; } = "";

    public string Name { get; init; } = "";

    public string Password { get; init; } = "";
}
