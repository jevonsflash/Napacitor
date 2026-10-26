using Microsoft.Extensions.Logging;

namespace NapacitorHost;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            })
            // 应用快捷方式(AppActions)的点击回调只能由宿主注册(MAUI 不允许插件
            // 自行订阅)。模板不静态引用插件程序集 —— 插件清单由 napacitor.build.props
            // 按安装情况生成 —— 故按类型名反射转发;未装 app-actions 时静默跳过。
            .ConfigureEssentials(essentials =>
                essentials.OnAppAction(ForwardAppAction));

        builder.Services.AddMauiBlazorWebView();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }

    /// <summary>快捷方式点击 → AppActions 插件 → JS 的 appActionPerformed 事件。</summary>
    private static void ForwardAppAction(AppAction action)
    {
        try
        {
            Type.GetType("Napacitor.Plugins.AppActions.AppActionsPlugin, Napacitor.AppActions")
                ?.GetMethod("NotifyActionPerformed")
                ?.Invoke(null, new object[] { action });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[NapacitorHost] AppAction 转发失败:{ex.Message}");
        }
    }
}
