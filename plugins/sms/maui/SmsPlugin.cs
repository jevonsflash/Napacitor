using Microsoft.Maui.ApplicationModel.Communication;

namespace Napacitor.Plugins.Sms;

/// <summary>短信发送选项。</summary>
public class SmsOptions
{
    public string[] Recipients { get; set; } = Array.Empty<string>();
    public string? Body { get; set; }
}

/// <summary>支持检测结果。</summary>
public class SmsSupportedResult
{
    public bool Supported { get; set; }
}

/// <summary>
/// Sms 插件:发送短信(封装 MAUI Sms API)。
/// </summary>
[NapacitorPlugin("Sms")]
public class SmsPlugin : NapacitorPluginBase
{
    /// <summary>检查是否支持发送短信。</summary>
    [NapacitorMethod]
    public Task<SmsSupportedResult> IsSupported()
    {
        return Task.FromResult(new SmsSupportedResult
        {
            Supported = Microsoft.Maui.ApplicationModel.Communication.Sms.Default.IsComposeSupported,
        });
    }

    /// <summary>发送短信(打开系统短信客户端)。</summary>
    [NapacitorMethod]
    public async Task Send(SmsOptions options)
    {
        if (options.Recipients == null || options.Recipients.Length == 0)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "Sms.send:需要提供收件人");
        }
        if (!Microsoft.Maui.ApplicationModel.Communication.Sms.Default.IsComposeSupported)
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "Sms.send:当前设备不支持发送短信");
        }
        var message = new Microsoft.Maui.ApplicationModel.Communication.SmsMessage
        {
            Body = options.Body,
        };
        foreach (var recipient in options.Recipients)
        {
            message.Recipients.Add(recipient);
        }
        await Microsoft.Maui.ApplicationModel.Communication.Sms.Default.ComposeAsync(message);
    }
}
