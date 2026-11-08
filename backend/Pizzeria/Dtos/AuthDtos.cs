namespace Pizzeria.Dtos;

public record RegisterDto(
    string email,
    string password,
    string name,
    string? phone,
    string? address
);

public record LoginDto(
    string email,
    string password
);
