using System.Globalization;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace Napacitor.Plugins.App;

/* ─── 返回 / 事件 DTO ─────────────────────────────────────── */

/// <summary>应用状态。</summary>
public class AppStateResult
{
    public bool IsActive { get; set; } = true;
}

/// <summary>getAppLanguage() 返回值。</summary>
public class AppLanguageResult
{
    public string Value { get; set; } = string.Empty;
}

/// <summary>getLaunchUrl() / appUrlOpen 事件载荷。</summary>
public class AppUrlResult
{
    public string Url { get; set; } = string.Empty;
}

/// <summary>backButton 事件载荷。</summary>
public class AppBackButtonResult
{
    public bool CanGoBack { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// App 插件:应用生命周期 / 退出 / 语言 / 启动链接
/// (映射 MAUI Window 生命周期事件 + Application.Quit + CultureInfo)。
///
/// 事件管线:首个 JS 监听器注册(或首次 getState)后,惰性挂接主 Window 的
/// Resumed / Stopped / Backgrounding 事件(移动端前后台 + 桌面 Stop/Display),
/// 状态变化经 appStateChange / pause / resume 派发。
///
/// 平台差异说明:appUrlOpen(深度链接)与 backButton(Android 返回键)MAUI 无
/// 跨平台可订阅事件,宿主需少量平台代码转发到 <see cref="NotifyAppLink"/> /
/// <see cref="NotifyBackButton"/>(见插件 README)。
/// </summary>
[NapacitorPlugin("App")]
public class AppPlugin : NapacitorPluginBase
{
    private const string AppStateChangeEvent = "appStateChange";
    private const string PauseEvent = "pause";
    private const string ResumeEvent = "resume";
    private const string AppUrlOpenEvent = "appUrlOpen";
    private const string BackButtonEvent = "backButton";

    /// <summary>当前插件实例(供宿主静态转发入口使用)。</summary>
    private static AppPlugin? _current;

    /// <summary>启动 / 最近一次收到的深度链接(宿主经 NotifyAppLink 写入)。</summary>
    private static string? _launchUrl;

    private Window? _window;
    private bool _hooked;
    private bool _isActive = true;

    public AppPlugin()
    {
        _current = this;
    }

    /// <summary>获取应用当前状态(顺带惰性挂接生命周期钩子)。</summary>
    [NapacitorMethod]
    public Task<AppStateResult> GetState()
    {
        EnsureWindowHooked();
        return Task.FromResult(new AppStateResult { IsActive = _isActive });
    }

    /// <summary>获取应用语言(CultureInfo.CurrentUICulture)。</summary>
    [NapacitorMethod]
    public Task<AppLanguageResult> GetAppLanguage()
    {
        var culture = CultureInfo.CurrentUICulture;
        var value = string.IsNullOrEmpty(culture.Name)
            ? culture.TwoLetterISOLanguageName
            : culture.Name;
        return Task.FromResult(new AppLanguageResult { Value = value });
    }

    /// <summary>获取启动深度链接(未收到过时 url 为空字符串)。</summary>
    [NapacitorMethod]
    public Task<AppUrlResult> GetLaunchUrl()
    {
        return Task.FromResult(new AppUrlResult { Url = _launchUrl ?? string.Empty });
    }

    /// <summary>退出应用(Windows/macOS 有效;移动端见 README 平台差异)。</summary>
    [NapacitorMethod]
    public Task ExitApp()
    {
        MainThread.BeginInvokeOnMainThread(() => Application.Current?.Quit());
        return Task.CompletedTask;
    }

    /// <summary>生命周期事件首个监听器注册时惰性挂接主 Window。</summary>
    protected override void OnListenerAdded(string eventName)
    {
        EnsureWindowHooked();
    }

    /* ── 宿主转发入口(深度链接 / Android 返回键)── */

    /// <summary>
    /// 宿主在 App.xaml.cs 的 OnAppLinkRequestReceived 重写中调用:
    /// 记录启动链接并向 JS 派发 appUrlOpen 事件(插件实例尚未创建时仅记录,
    /// getLaunchUrl 仍可读到)。
    /// </summary>
    public static void NotifyAppLink(Uri uri)
    {
        _launchUrl = uri.ToString();
        _current?.NotifyListeners(AppUrlOpenEvent, new AppUrlResult { Url = _launchUrl });
    }

    /// <summary>
    /// 宿主在 Android MainActivity 的 OnBackPressed 重写中调用:
    /// 向 JS 派发 backButton 事件(无 JS 监听器时返回 false,走系统默认行为)。
    /// </summary>
    public static bool NotifyBackButton(bool canGoBack = false)
    {
        var plugin = _current;
        if (plugin is null || plugin.ListenerCount(BackButtonEvent) == 0)
        {
            return false;
        }
        plugin.NotifyListeners(BackButtonEvent, new AppBackButtonResult { CanGoBack = canGoBack });
        return true; // 已消费:宿主应拦截本次返回键
    }

    /* ── Window 生命周期挂接 ── */

    private void EnsureWindowHooked()
    {
        if (_hooked)
        {
            return;
        }
        MainThread.BeginInvokeOnMainThread(() =>
        {
            if (_hooked)
            {
                return;
            }
            var window = Application.Current?.Windows?.FirstOrDefault();
            if (window is null)
            {
                return; // 窗口尚未创建:下次 getState / OnListenerAdded 再试
            }

            _window = window;
            _hooked = true;
            window.Resumed += OnWindowResumed;       // 移动端回到前台
            window.Stopped += OnWindowStopped;       // 移动端/桌面进入后台
            window.Backgrounding += OnWindowBackgrounding; // iOS 即将转后台
        });
    }

    private void OnWindowResumed(object? sender, EventArgs e) => SetActive(true);

    private void OnWindowStopped(object? sender, EventArgs e) => SetActive(false);

    private void OnWindowBackgrounding(object? sender, BackgroundingEventArgs e) =>
        SetActive(false);

    private void SetActive(bool active)
    {
        if (_isActive == active)
        {
            return;
        }
        _isActive = active;
        NotifyListeners(AppStateChangeEvent, new AppStateResult { IsActive = active });
        NotifyListeners(active ? ResumeEvent : PauseEvent, null);
    }
}
