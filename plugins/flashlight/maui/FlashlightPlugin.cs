namespace Napacitor.Plugins.Flashlight;

/// <summary>手电筒开关选项。</summary>
public class FlashlightOptions
{
    /// <summary>亮度级别(0.0 - 1.0);仅部分平台支持,默认 1.0。</summary>
    public double? Intensity { get; set; }
}

/// <summary>手电筒状态查询结果。</summary>
public class FlashlightStateResult
{
    public bool IsOn { get; set; }
}

/// <summary>支持检测结果。</summary>
public class FlashlightSupportedResult
{
    public bool Supported { get; set; }
}

/// <summary>
/// Flashlight 插件:手电筒控制(封装 MAUI Flashlight API)。
/// 基于 MAUI Essentials Flashlight 门面实现;不支持手电筒的平台
/// (如 Windows 桌面)将抛出 UNSUPPORTED 异常。
/// </summary>
[NapacitorPlugin("Flashlight")]
public class FlashlightPlugin : NapacitorPluginBase
{
    private bool _isOn;

    /// <summary>检查当前设备是否支持手电筒。</summary>
    [NapacitorMethod]
    public async Task<FlashlightSupportedResult> IsSupported()
    {
        var supported = await Microsoft.Maui.Devices.Flashlight.Default.IsSupportedAsync();
        return new FlashlightSupportedResult { Supported = supported };
    }

    /// <summary>打开手电筒。</summary>
    [NapacitorMethod]
    public async Task SwitchOn(FlashlightOptions options)
    {
        if (!await Microsoft.Maui.Devices.Flashlight.Default.IsSupportedAsync())
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "Flashlight.switchOn:当前设备不支持手电筒");
        }
        await Microsoft.Maui.Devices.Flashlight.Default.TurnOnAsync();
        _isOn = true;
    }

    /// <summary>关闭手电筒。</summary>
    [NapacitorMethod]
    public async Task SwitchOff()
    {
        if (!await Microsoft.Maui.Devices.Flashlight.Default.IsSupportedAsync())
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "Flashlight.switchOff:当前设备不支持手电筒");
        }
        await Microsoft.Maui.Devices.Flashlight.Default.TurnOffAsync();
        _isOn = false;
    }

    /// <summary>切换手电筒状态。</summary>
    [NapacitorMethod]
    public async Task Toggle(FlashlightOptions options)
    {
        if (_isOn)
        {
            await SwitchOff();
        }
        else
        {
            await SwitchOn(options);
        }
    }

    /// <summary>查询手电筒当前状态。</summary>
    [NapacitorMethod]
    public Task<FlashlightStateResult> GetState()
    {
        return Task.FromResult(new FlashlightStateResult { IsOn = _isOn });
    }
}
