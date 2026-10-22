using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.AppInfo;

/// <summary>应用信息。</summary>
public class AppInfoDataResult
{
    public string Name { get; set; } = string.Empty;
    public string Id { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Build { get; set; } = string.Empty;
    public string Theme { get; set; } = "light";
    public string RequestedLayoutOrientation { get; set; } = "unspecified";
}

/// <summary>版本跟踪信息。</summary>
public class VersionTrackingResult
{
    public string CurrentVersion { get; set; } = string.Empty;
    public string CurrentBuild { get; set; } = string.Empty;
    public bool IsFirstLaunchEver { get; set; }
    public bool IsFirstLaunchForCurrentVersion { get; set; }
    public bool IsFirstLaunchForCurrentBuild { get; set; }
    public string PreviousVersion { get; set; } = string.Empty;
    public string PreviousBuild { get; set; } = string.Empty;
    public string[] VersionHistory { get; set; } = Array.Empty<string>();
    public string[] BuildHistory { get; set; } = Array.Empty<string>();
}

/// <summary>
/// AppInfo 插件:应用信息与版本跟踪(封装 MAUI AppInfo + VersionTracking API)。
/// </summary>
[NapacitorPlugin("AppInfo")]
public class AppInfoPlugin : NapacitorPluginBase
{
    /// <summary>获取应用信息。</summary>
    [NapacitorMethod]
    public Task<AppInfoDataResult> GetInfo()
    {
        var info = Microsoft.Maui.ApplicationModel.AppInfo.Current;
        var theme = info.RequestedTheme switch
        {
            Microsoft.Maui.ApplicationModel.AppTheme.Dark => "dark",
            Microsoft.Maui.ApplicationModel.AppTheme.Light => "light",
            _ => "system",
        };
        return Task.FromResult(new AppInfoDataResult
        {
            Name = info.Name ?? string.Empty,
            Id = info.PackageName ?? string.Empty,
            Version = info.VersionString ?? string.Empty,
            Build = info.BuildString ?? string.Empty,
            Theme = theme,
            RequestedLayoutOrientation = DeviceDisplay.Current.MainDisplayInfo.Orientation.ToString().ToLowerInvariant(),
        });
    }

    /// <summary>获取版本跟踪信息。</summary>
    [NapacitorMethod]
    public Task<VersionTrackingResult> GetVersionTracking()
    {
        VersionTracking.Default.Track();
        return Task.FromResult(new VersionTrackingResult
        {
            CurrentVersion = VersionTracking.Default.CurrentVersion ?? string.Empty,
            CurrentBuild = VersionTracking.Default.CurrentBuild ?? string.Empty,
            IsFirstLaunchEver = VersionTracking.Default.IsFirstLaunchEver,
            IsFirstLaunchForCurrentVersion = VersionTracking.Default.IsFirstLaunchForCurrentVersion,
            IsFirstLaunchForCurrentBuild = VersionTracking.Default.IsFirstLaunchForCurrentBuild,
            PreviousVersion = VersionTracking.Default.PreviousVersion ?? string.Empty,
            PreviousBuild = VersionTracking.Default.PreviousBuild ?? string.Empty,
            VersionHistory = VersionTracking.Default.VersionHistory?.ToArray() ?? Array.Empty<string>(),
            BuildHistory = VersionTracking.Default.BuildHistory?.ToArray() ?? Array.Empty<string>(),
        });
    }

    /// <summary>显示应用信息对话框(部分平台)。</summary>
    [NapacitorMethod]
    public Task ShowSettingsUI()
    {
        // MAUI 无内置 ShowSettingsUI;此处为扩展点
        System.Diagnostics.Debug.WriteLine("[Napacitor] AppInfo.showSettingsUI:当前平台无内置设置 UI");
        return Task.CompletedTask;
    }

    /// <summary>打开应用系统设置页面。</summary>
    [NapacitorMethod]
    public Task OpenSettings()
    {
        Microsoft.Maui.ApplicationModel.AppInfo.Current.ShowSettingsUI();
        return Task.CompletedTask;
    }
}
