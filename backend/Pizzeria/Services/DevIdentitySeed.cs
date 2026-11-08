using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pizzeria.Configuration;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Services;

public static class DevIdentitySeed
{
    public static async Task RunAsync(
        IConfiguration configuration,
        ILogger logger,
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        var seed = configuration.GetSection(SeedOptions.SectionName).Get<SeedOptions>() ?? new SeedOptions();

        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var db = services.GetRequiredService<PizzeriaContext>();

        var adminEmail = string.IsNullOrWhiteSpace(seed.Admin.Email)
            ? "admin@pizzeria.local"
            : seed.Admin.Email.Trim();

        if (string.IsNullOrWhiteSpace(seed.Admin.Password))
        {
            var adminExists = await userManager.FindByEmailAsync(adminEmail).ConfigureAwait(false) != null;
            if (!adminExists)
            {
                logger.LogWarning(
                    "Сид Identity пропущен: не задан {Section}:Admin:Password (user-secrets или переменная окружения). " +
                    "Создайте секреты или задайте пароль — иначе демо-пользователи не будут созданы.",
                    SeedOptions.SectionName);
                return;
            }
        }

        const string adminRoleName = "Admin";

        if (!await roleManager.RoleExistsAsync(adminRoleName).ConfigureAwait(false))
            await roleManager.CreateAsync(new IdentityRole(adminRoleName)).ConfigureAwait(false);

        var adminUser = await userManager.FindByEmailAsync(adminEmail).ConfigureAwait(false);
        if (adminUser == null)
        {
            adminUser = new IdentityUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, seed.Admin.Password).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    "Не удалось создать пользователя-админа: " +
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, adminRoleName).ConfigureAwait(false))
            await userManager.AddToRoleAsync(adminUser, adminRoleName).ConfigureAwait(false);

        if (!await db.customers.AnyAsync(c => c.user_id == adminUser.Id, cancellationToken).ConfigureAwait(false))
        {
            db.customers.Add(new customer
            {
                name = "Администратор",
                phone = "+7 900 000-00-00",
                address = "СПБ, Админская ул., 1",
                email = adminEmail,
                user_id = adminUser.Id
            });
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        const string courierRoleName = "Courier";
        if (!await roleManager.RoleExistsAsync(courierRoleName).ConfigureAwait(false))
            await roleManager.CreateAsync(new IdentityRole(courierRoleName)).ConfigureAwait(false);

        foreach (var entry in seed.Couriers)
        {
            if (string.IsNullOrWhiteSpace(entry.Email))
                continue;
            if (string.IsNullOrWhiteSpace(entry.Password))
            {
                logger.LogInformation(
                    "Сид курьера {Email} пропущен: пустой пароль в {Section}.",
                    entry.Email.Trim(),
                    SeedOptions.SectionName);
                continue;
            }

            var email = entry.Email.Trim();
            var user = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            if (user == null)
            {
                user = new IdentityUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, entry.Password).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Не удалось создать пользователя-курьера {email}: " +
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            if (!await userManager.IsInRoleAsync(user, courierRoleName).ConfigureAwait(false))
                await userManager.AddToRoleAsync(user, courierRoleName).ConfigureAwait(false);

            if (!await db.employees.AnyAsync(e => e.user_id == user.Id, cancellationToken).ConfigureAwait(false))
            {
                db.employees.Add(new employee
                {
                    name = string.IsNullOrWhiteSpace(entry.Name) ? email : entry.Name,
                    user_id = user.Id,
                    Role = EmployeeRole.Courier,
                    is_on_shift = false,
                    break_until = null
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        const string cookRoleName = "Cook";
        if (!await roleManager.RoleExistsAsync(cookRoleName).ConfigureAwait(false))
            await roleManager.CreateAsync(new IdentityRole(cookRoleName)).ConfigureAwait(false);

        foreach (var entry in seed.Cooks)
        {
            if (string.IsNullOrWhiteSpace(entry.Email))
                continue;
            if (string.IsNullOrWhiteSpace(entry.Password))
            {
                logger.LogInformation(
                    "Сид повара {Email} пропущен: пустой пароль в {Section}.",
                    entry.Email.Trim(),
                    SeedOptions.SectionName);
                continue;
            }

            var email = entry.Email.Trim();
            var user = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            if (user == null)
            {
                user = new IdentityUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, entry.Password).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Не удалось создать пользователя-повара {email}: " +
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            if (!await userManager.IsInRoleAsync(user, cookRoleName).ConfigureAwait(false))
                await userManager.AddToRoleAsync(user, cookRoleName).ConfigureAwait(false);

            if (!await db.employees.AnyAsync(e => e.user_id == user.Id, cancellationToken).ConfigureAwait(false))
            {
                db.employees.Add(new employee
                {
                    name = string.IsNullOrWhiteSpace(entry.Name) ? email : entry.Name,
                    user_id = user.Id,
                    Role = EmployeeRole.Cook,
                    is_on_shift = false,
                    break_until = null
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        const string collectorRoleName = "Collector";
        if (!await roleManager.RoleExistsAsync(collectorRoleName).ConfigureAwait(false))
            await roleManager.CreateAsync(new IdentityRole(collectorRoleName)).ConfigureAwait(false);

        foreach (var entry in seed.Collectors)
        {
            if (string.IsNullOrWhiteSpace(entry.Email))
                continue;
            if (string.IsNullOrWhiteSpace(entry.Password))
            {
                logger.LogInformation(
                    "Сид сборщика {Email} пропущен: пустой пароль в {Section}.",
                    entry.Email.Trim(),
                    SeedOptions.SectionName);
                continue;
            }

            var email = entry.Email.Trim();
            var user = await userManager.FindByEmailAsync(email).ConfigureAwait(false);
            if (user == null)
            {
                user = new IdentityUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, entry.Password).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Не удалось создать пользователя-сборщика {email}: " +
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }

            if (!await userManager.IsInRoleAsync(user, collectorRoleName).ConfigureAwait(false))
                await userManager.AddToRoleAsync(user, collectorRoleName).ConfigureAwait(false);

            if (!await db.employees.AnyAsync(e => e.user_id == user.Id, cancellationToken).ConfigureAwait(false))
            {
                db.employees.Add(new employee
                {
                    name = string.IsNullOrWhiteSpace(entry.Name) ? email : entry.Name,
                    user_id = user.Id,
                    Role = EmployeeRole.Collector,
                    is_on_shift = false,
                    break_until = null
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
