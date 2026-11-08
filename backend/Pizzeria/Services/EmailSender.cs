using System.Linq;
using System.Text.RegularExpressions;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Pizzeria.Services;

public sealed record EmailMessage
{
    public required string ToAddress { get; init; }
    public string? ToName { get; init; }
    public required string Subject { get; init; }
    public required string HtmlBody { get; init; }
    public string? TextBody { get; init; }
}

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _opt;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _opt = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        if (!_opt.Enabled)
        {
            _logger.LogInformation(
                "Email отключён в конфиге, письмо в {To} (тема: {Subject}) пропущено.",
                message.ToAddress, message.Subject);
            return;
        }

        if (string.IsNullOrWhiteSpace(_opt.Host) || string.IsNullOrWhiteSpace(_opt.FromAddress))
        {
            _logger.LogWarning(
                "Email сконфигурирован некорректно (Host/FromAddress пусты), письмо в {To} пропущено.",
                message.ToAddress);
            return;
        }

        var mime = new MimeMessage();
        mime.From.Add(new MailboxAddress(_opt.FromName ?? "Pizzeria", _opt.FromAddress));
        mime.To.Add(new MailboxAddress(message.ToName ?? "", message.ToAddress));
        mime.Subject = message.Subject;

        var builder = new BodyBuilder
        {
            HtmlBody = message.HtmlBody,
            TextBody = message.TextBody ?? StripHtml(message.HtmlBody)
        };
        mime.Body = builder.ToMessageBody();

        mime.Headers.Add("Auto-Submitted", "auto-generated");
        if (string.IsNullOrEmpty(mime.MessageId))
        {
            var domain = "localhost";
            if (MailboxAddress.TryParse(_opt.FromAddress, out var fromMb) && !string.IsNullOrEmpty(fromMb.Domain))
                domain = fromMb.Domain;
            mime.MessageId = $"<{Guid.NewGuid():N}@{domain}>";
        }

        using var client = new SmtpClient();
        try
        {
            SecureSocketOptions secureOption;
            if (_opt.UseStartTls)
                secureOption = SecureSocketOptions.StartTls;
            else if (_opt.Port == 465)
                secureOption = SecureSocketOptions.SslOnConnect;
            else
                secureOption = SecureSocketOptions.None;

            await client.ConnectAsync(_opt.Host, _opt.Port, secureOption, cancellationToken).ConfigureAwait(false);

            var smtpUser = (_opt.Username ?? string.Empty).Trim();
            var smtpSecret = string.Concat((_opt.Password ?? string.Empty).Where(c => !char.IsWhiteSpace(c)));

            if (!string.IsNullOrEmpty(smtpUser))
                await client.AuthenticateAsync(smtpUser, smtpSecret, cancellationToken).ConfigureAwait(false);

            await client.SendAsync(mime, cancellationToken).ConfigureAwait(false);

            _logger.LogInformation(
                "Письмо отправлено: to={To}, subject={Subject}",
                message.ToAddress, message.Subject);
        }
        catch (Exception ex)
        {
            var user = string.IsNullOrEmpty(_opt.Username) ? "(пусто)" : _opt.Username.Trim();
            if (ex is SmtpCommandException smtp &&
                smtp.Message.Contains("SPAM", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    ex,
                    "Яндекс отклонил письмо как подозрительное на спам (это не ошибка адреса получателя). " +
                    "Что попробовать: другой ящик/домен отправителя (@yandex.ru вместо .com), «прогреть» аккаунт, " +
                    "не слать много одинаковых писем подряд, см. https://ya.cc/1IrBc ; для разработки — Mailpit и Email:Enabled=false. " +
                    "to={To}, host={Host}:{Port}, user={User}",
                    message.ToAddress, _opt.Host, _opt.Port, user);
            }
            else
            {
                _logger.LogError(
                    ex,
                    "SMTP: ошибка отправки to={To}, host={Host}:{Port}, UseStartTls={Tls}, user={User}. {Message}",
                    message.ToAddress,
                    _opt.Host,
                    _opt.Port,
                    _opt.UseStartTls,
                    user,
                    ex.Message);
            }

            throw;
        }
        finally
        {
            if (client.IsConnected)
                await client.DisconnectAsync(true, cancellationToken).ConfigureAwait(false);
        }
    }

    private static string StripHtml(string html) =>
        Regex.Replace(html, "<.*?>", string.Empty);
}
