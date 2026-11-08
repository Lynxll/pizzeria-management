using Microsoft.EntityFrameworkCore;
using Pizzeria.Data;
using Pizzeria.Models;

namespace Pizzeria.Services;

public interface IOrderNotificationService
{
    Task NotifyStatusChangedAsync(int orderId, OrderStatus newStatus, CancellationToken cancellationToken = default);
}

public sealed class OrderNotificationService : IOrderNotificationService
{
    private static readonly HashSet<OrderStatus> NotifiableStatuses = new()
    {
        OrderStatus.Cooking,
        OrderStatus.Ready,
        OrderStatus.InTransit,
        OrderStatus.Delivered
    };

    private readonly PizzeriaContext _context;
    private readonly IEmailQueue _queue;
    private readonly ILogger<OrderNotificationService> _logger;

    public OrderNotificationService(
        PizzeriaContext context,
        IEmailQueue queue,
        ILogger<OrderNotificationService> logger)
    {
        _context = context;
        _queue = queue;
        _logger = logger;
    }

    public async Task NotifyStatusChangedAsync(int orderId, OrderStatus newStatus, CancellationToken cancellationToken = default)
    {
        if (!NotifiableStatuses.Contains(newStatus))
            return;

        var info = await _context.Set<order>()
            .AsNoTracking()
            .Where(o => o.id == orderId)
            .Select(o => new
            {
                o.id,
                o.contact_email,
                o.contact_name,
                o.delivery_address,
                customer_email = o.customer.email,
                customer_name = o.customer.name
            })
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (info is null)
        {
            _logger.LogWarning("NotifyStatusChanged: заказ {OrderId} не найден.", orderId);
            return;
        }

        var recipient = !string.IsNullOrWhiteSpace(info.contact_email)
            ? info.contact_email
            : info.customer_email;

        if (string.IsNullOrWhiteSpace(recipient))
        {
            _logger.LogInformation(
                "Заказ {OrderId}: email получателя не задан (contact_email и customer.email пусты), уведомление пропущено.",
                info.id);
            return;
        }

        var displayName = !string.IsNullOrWhiteSpace(info.contact_name)
            ? info.contact_name
            : info.customer_name;

        var (subject, html, text) = BuildEmailContent(info.id, newStatus, displayName, info.delivery_address);

        var message = new EmailMessage
        {
            ToAddress = recipient!,
            ToName = displayName,
            Subject = subject,
            HtmlBody = html,
            TextBody = text
        };

        await _queue.EnqueueAsync(message, cancellationToken).ConfigureAwait(false);
    }

    private static (string Subject, string Html, string Text) BuildEmailContent(
        int orderId,
        OrderStatus status,
        string? name,
        string? address)
    {
        var greeting = string.IsNullOrWhiteSpace(name)
            ? "Здравствуйте!"
            : $"Здравствуйте, {name}!";

        var addressBlockHtml = string.IsNullOrWhiteSpace(address)
            ? ""
            : $"<p>Адрес доставки: {System.Net.WebUtility.HtmlEncode(address)}</p>";

        return status switch
        {
            OrderStatus.Cooking => (
                Subject: $"Заказ №{orderId} готовится",
                Html: $"<p>{greeting}</p>" +
                      $"<p>Ваш заказ <b>№{orderId}</b> принят в работу и сейчас готовится на кухне.</p>" +
                      addressBlockHtml +
                      "<p>Мы сообщим, когда курьер выедет к вам.</p>",
                Text: $"{greeting}\nВаш заказ №{orderId} принят в работу и сейчас готовится."
            ),

            OrderStatus.Ready => (
                Subject: $"Заказ №{orderId} собран и готов к доставке",
                Html: $"<p>{greeting}</p>" +
                      $"<p>Ваш заказ <b>№{orderId}</b> собран и передан в доставку. Скоро его заберёт курьер.</p>" +
                      addressBlockHtml +
                      "<p>Мы пришлём отдельное сообщение, когда курьер выедет к вам.</p>",
                Text: $"{greeting}\nВаш заказ №{orderId} собран и готов к доставке."
            ),

            OrderStatus.InTransit => (
                Subject: $"Заказ №{orderId} в пути",
                Html: $"<p>{greeting}</p>" +
                      $"<p>Курьер уже забрал ваш заказ <b>№{orderId}</b> и выехал к вам.</p>" +
                      addressBlockHtml +
                      "<p>Пожалуйста, будьте на связи по указанному телефону.</p>",
                Text: $"{greeting}\nВаш заказ №{orderId} в пути."
            ),

            OrderStatus.Delivered => (
                Subject: $"Заказ №{orderId} доставлен",
                Html: $"<p>{greeting}</p>" +
                      $"<p>Ваш заказ <b>№{orderId}</b> доставлен. Приятного аппетита!</p>" +
                      "<p>Будем рады вашему отзыву.</p>",
                Text: $"{greeting}\nВаш заказ №{orderId} доставлен. Приятного аппетита!"
            ),

            _ => (
                Subject: $"Заказ №{orderId}",
                Html: $"<p>{greeting}</p><p>Статус заказа №{orderId} обновлён.</p>",
                Text: $"Статус заказа №{orderId} обновлён."
            )
        };
    }
}
