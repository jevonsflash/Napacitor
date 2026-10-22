using Microsoft.Maui.ApplicationModel.Communication;

namespace Napacitor.Plugins.PhoneDialer;

/// <summary>拨号选项。</summary>
public class DialOptions
{
    public string Number { get; set; } = string.Empty;
}

/// <summary>支持检测结果。</summary>
public class PhoneDialerSupportedResult
{
    public bool Supported { get; set; }
}

/// <summary>
/// PhoneDialer 插件:拨打电话(封装 MAUI PhoneDialer API)。
/// </summary>
[NapacitorPlugin("PhoneDialer")]
public class PhoneDialerPlugin : NapacitorPluginBase
{
    /// <summary>检查是否支持拨打电话。</summary>
    [NapacitorMethod]
    public Task<PhoneDialerSupportedResult> IsSupported()
    {
        return Task.FromResult(new PhoneDialerSupportedResult
        {
            Supported = Microsoft.Maui.ApplicationModel.Communication.PhoneDialer.Default.IsSupported,
        });
    }

    /// <summary>拨打电话(打开系统拨号界面)。</summary>
    [NapacitorMethod]
    public Task Open(DialOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Number))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "PhoneDialer.open:需要提供电话号码");
        }
        if (!Microsoft.Maui.ApplicationModel.Communication.PhoneDialer.Default.IsSupported)
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "PhoneDialer.open:当前设备不支持拨打电话");
        }
        Microsoft.Maui.ApplicationModel.Communication.PhoneDialer.Default.Open(options.Number);
        return Task.CompletedTask;
    }
}
