using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Graphics;

namespace Napacitor.Plugins.Browser;

/// <summary>open() 参数。</summary>
public class BrowserOpenOptions
{
    /// <summary>要打开的绝对地址。</summary>
    public string? Url { get; set; }

    /// <summary>工具栏颜色(#RRGGBB / #AARRGGBB;平台不支持时忽略)。</summary>
    public string? ToolbarColor { get; set; }
}

/// <summary>
/// Browser 插件:系统内嵌浏览器(封装 MAUI Browser API)。
///
/// 平台差异说明:MAUI Browser API 仅提供 OpenAsync(Android Custom Tabs /
/// iOS SFSafariViewController / 桌面回退外部浏览器),close 与
/// browserFinished / browserPageLoaded 事件需少量平台代码,暂不实现。
/// </summary>
[NapacitorPlugin("Browser")]
public class BrowserPlugin : NapacitorPluginBase
{
    private const string FinishedEvent = "browserFinished";
    private const string PageLoadedEvent = "browserPageLoaded";

    /// <summary>打开内嵌浏览器页面(SystemPreferred 模式)。</summary>
    [NapacitorMethod]
    public async Task Open(BrowserOpenOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Url) ||
            !Uri.TryCreate(options.Url, UriKind.Absolute, out var uri))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "Browser.open:url 必须为合法的绝对地址");
        }

        var launchOptions = new BrowserLaunchOptions
        {
            LaunchMode = BrowserLaunchMode.SystemPreferred,
        };
        if (!string.IsNullOrEmpty(options.ToolbarColor))
        {
            try
            {
                launchOptions.PreferredToolbarColor = Color.FromArgb(options.ToolbarColor);
            }
            catch (ArgumentException)
            {
                // 非法颜色串忽略,按平台默认工具栏色处理
            }
        }

        await Microsoft.Maui.ApplicationModel.Browser.Default.OpenAsync(uri, launchOptions);
    }

    /// <summary>关闭浏览器窗口(MAUI 未提供跨平台关闭入口)。</summary>
    [NapacitorMethod]
    public Task Close()
    {
        throw new NapacitorException(
            NapacitorException.NotImplemented,
            "Browser.close:MAUI Browser API 未提供跨平台关闭入口" +
            "(Android Custom Tabs / iOS SFSafariViewController 需少量平台代码)");
    }

    /// <summary>浏览器事件监听注册(提示:当前原生端不派发,需平台代码)。</summary>
    protected override void OnListenerAdded(string eventName)
    {
        if (eventName == FinishedEvent || eventName == PageLoadedEvent)
        {
            System.Diagnostics.Debug.WriteLine(
                $"[Napacitor] Browser.{eventName}:事件派发需平台代码支持,当前不会触发");
        }
    }
}
