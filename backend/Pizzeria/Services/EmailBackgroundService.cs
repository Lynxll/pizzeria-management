using MailKit.Net.Smtp;

namespace Pizzeria.Services;

public sealed class EmailBackgroundService : BackgroundService
{
    private readonly IEmailQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailBackgroundService> _logger;

    public EmailBackgroundService(
        IEmailQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailBackgroundService> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailBackgroundService запущен.");

        while (!stoppingToken.IsCancellationRequested)
        {
            EmailMessage message;
            try
            {
                message = await _queue.DequeueAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await sender.SendAsync(message, stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                if (ex is SmtpCommandException smtp &&
                    smtp.Message.Contains("SPAM", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning(
                        "Очередь email: письмо не доставлено (SMTP отклонил как спам). {To}, тема: {Subject}. Подробности — в логе SmtpEmailSender.",
                        message.ToAddress, message.Subject);
                }
                else
                {
                    _logger.LogError(
                        ex,
                        "Ошибка отправки письма на {To} (тема: {Subject}).",
                        message.ToAddress, message.Subject);
                }
            }
        }
    }
}
