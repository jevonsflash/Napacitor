using System.Globalization;
using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.Device;

/// <summary>getInfo() 返回结构(与 @capacitor/device 的 DeviceInfo 对应)。</summary>
public class DeviceInfoResult
{
    public string Model { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string OsVersion { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public bool IsVirtual { get; set; }
    public string? Name { get; set; }
}

/// <summary>getLanguageCode() / getLocale() 返回结构。</summary>
public class StringValueResult
{
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Device 插件:设备基础信息(与 @capacitor/device 对应)。
/// </summary>
[NapacitorPlugin("Device")]
public class DevicePlugin : NapacitorPluginBase
{
    /// <summary>获取设备信息。</summary>
    [NapacitorMethod]
    public Task<DeviceInfoResult> GetInfo()
    {
        var info = DeviceInfo.Current;
        return Task.FromResult(new DeviceInfoResult
        {
            Model = info.Model ?? string.Empty,
            Platform = NapacitorRuntime.PlatformName,
            OsVersion = info.VersionString ?? string.Empty,
            Manufacturer = info.Manufacturer ?? string.Empty,
            IsVirtual = info.DeviceType == DeviceType.Virtual,
            Name = info.Name,
        });
    }

    /// <summary>获取当前 UI 语言代码(如 zh、en)。</summary>
    [NapacitorMethod]
    public Task<StringValueResult> GetLanguageCode()
    {
        return Task.FromResult(new StringValueResult
        {
            Value = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName,
        });
    }

    /// <summary>获取当前区域设置(如 zh-CN)。</summary>
    [NapacitorMethod]
    public Task<StringValueResult> GetLocale()
    {
        return Task.FromResult(new StringValueResult
        {
            Value = CultureInfo.CurrentCulture.Name,
        });
    }
}
