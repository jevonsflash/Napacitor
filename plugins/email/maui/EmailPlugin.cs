using Microsoft.Maui.ApplicationModel.Communication;

namespace Napacitor.Plugins.Email;

/// <summary>邮件编写选项。</summary>
public class ComposeOptions
{
    public string[]? To { get; set; }
    public string[]? Cc { get; set; }
    public string[]? Bcc { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
    public bool? IsHtml { get; set; }
    public string[]? Attachments { get; set; }
}

/// <summary>支持检测结果。</summary>
public class EmailSupportedResult
{
    public bool Supported { get; set; }
}

/// <summary>
/// Email 插件:发送电子邮件(封装 MAUI Email API)。
/// </summary>
[NapacitorPlugin("Email")]
public class EmailPlugin : NapacitorPluginBase
{
    /// <summary>检查是否支持发送邮件。</summary>
    [NapacitorMethod]
    public Task<EmailSupportedResult> IsSupported()
    {
        return Task.FromResult(new EmailSupportedResult
        {
            Supported = Microsoft.Maui.ApplicationModel.Communication.Email.Default.IsComposeSupported,
        });
    }

    /// <summary>编写并发送邮件(打开系统邮件客户端)。</summary>
    [NapacitorMethod]
    public async Task Compose(ComposeOptions options)
    {
        var message = new Microsoft.Maui.ApplicationModel.Communication.EmailMessage
        {
            Subject = options.Subject,
            Body = options.Body,
        };
        if (options.To?.Length > 0) message.To = options.To.ToList();
        if (options.Cc?.Length > 0) message.Cc = options.Cc.ToList();
        if (options.Bcc?.Length > 0) message.Bcc = options.Bcc.ToList();
        if (options.IsHtml == true) message.Body = options.Body;

        if (!Microsoft.Maui.ApplicationModel.Communication.Email.Default.IsComposeSupported)
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "Email.compose:当前设备不支持发送邮件");
        }
        await Microsoft.Maui.ApplicationModel.Communication.Email.Default.ComposeAsync(message);
    }
}
