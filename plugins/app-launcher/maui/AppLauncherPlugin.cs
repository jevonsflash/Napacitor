using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.AppLauncher;

/// <summary>openUrl() 参数。</summary>
public class OpenUrlOptions
{
    public string Url { get; set; } = string.Empty;
}

/// <summary>openApp() 参数。</summary>
public class OpenAppOptions
{
    public string AppId { get; set; } = string.Empty;
}

/// <summary>canOpenUrl() / canOpenApp() 返回结构。</summary>
public class CanOpenResult
{
    public bool CanOpen { get; set; }
}

/// <summary>openMap() 参数。</summary>
public class OpenMapOptions
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Label { get; set; }
    public string? NavigationMode { get; set; }
}

/// <summary>
/// AppLauncher 插件:打开其他应用 / URL / 地图(封装 MAUI Launcher + Map API)。
/// </summary>
[NapacitorPlugin("AppLauncher")]
public class AppLauncherPlugin : NapacitorPluginBase
{
    /// <summary>打开 URL(浏览器 / 系统处理)。</summary>
    [NapacitorMethod]
    public async Task OpenUrl(OpenUrlOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Url))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "AppLauncher.openUrl 需要提供 url 参数");
        }
        if (!Uri.TryCreate(options.Url, UriKind.Absolute, out var uri))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"AppLauncher.openUrl:无效的 URL '{options.Url}'");
        }
        var supported = await Launcher.Default.CanOpenAsync(uri);
        if (!supported)
        {
            // 即使 CanOpen 返回 false,仍尝试打开(部分平台检测不准)
            System.Diagnostics.Debug.WriteLine(
                $"[Napacitor] AppLauncher.openUrl:平台报告无法处理 '{options.Url}',仍尝试打开");
        }
        await Launcher.Default.OpenAsync(uri);
    }

    /// <summary>检查是否能处理该 URL。</summary>
    [NapacitorMethod]
    public async Task<CanOpenResult> CanOpenUrl(OpenUrlOptions options)
    {
        if (!Uri.TryCreate(options.Url, UriKind.Absolute, out var uri))
        {
            return new CanOpenResult { CanOpen = false };
        }
        var supported = await Launcher.Default.CanOpenAsync(uri);
        return new CanOpenResult { CanOpen = supported };
    }

    /// <summary>通过包名打开应用(映射到 Launcher 的 URI 协议)。</summary>
    [NapacitorMethod]
    public async Task OpenApp(OpenAppOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.AppId))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "AppLauncher.openApp 需要提供 appId 参数");
        }
        // 尝试通过 scheme:// 打开
        var uri = new Uri($"{options.AppId}://");
        var supported = await Launcher.Default.CanOpenAsync(uri);
        if (!supported)
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                $"AppLauncher.openApp:无法打开应用 '{options.AppId}'");
        }
        await Launcher.Default.OpenAsync(uri);
    }

    /// <summary>检查是否安装了指定应用。</summary>
    [NapacitorMethod]
    public async Task<CanOpenResult> CanOpenApp(OpenAppOptions options)
    {
        try
        {
            var uri = new Uri($"{options.AppId}://");
            var supported = await Launcher.Default.CanOpenAsync(uri);
            return new CanOpenResult { CanOpen = supported };
        }
        catch
        {
            return new CanOpenResult { CanOpen = false };
        }
    }

    /// <summary>打开系统地图并定位到指定坐标。</summary>
    [NapacitorMethod]
    public async Task OpenMap(OpenMapOptions options)
    {
        var mapOptions = new MapLaunchOptions
        {
            Name = options.Label ?? string.Empty,
        };
        if (!string.IsNullOrWhiteSpace(options.NavigationMode))
        {
            mapOptions.NavigationMode = options.NavigationMode.ToLowerInvariant() switch
            {
                "driving" => Microsoft.Maui.ApplicationModel.NavigationMode.Driving,
                "walking" => Microsoft.Maui.ApplicationModel.NavigationMode.Walking,
                "transit" => Microsoft.Maui.ApplicationModel.NavigationMode.Transit,
                _ => Microsoft.Maui.ApplicationModel.NavigationMode.None,
            };
        }
        await Map.Default.OpenAsync(options.Latitude, options.Longitude, mapOptions);
    }
}
