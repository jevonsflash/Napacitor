using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.Runtime;

namespace NapacitorHost.Platforms.Android;

[Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true,
    ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation |
                           ConfigChanges.UiMode | ConfigChanges.ScreenLayout |
                           ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
// 应用快捷方式(AppActions):缺少该 filter 时启动器解析不到快捷方式的 Intent,
// 点击快捷方式会由系统提示"应用未安装";OnResume / OnNewIntent 负责把点击
// 转交 MAUI(再由 MauiProgram 的 OnAppAction 转发到插件)。
[IntentFilter(new[] { Platform.Intent.ActionAppAction },
    Categories = new[] { Intent.CategoryDefault })]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnResume()
    {
        base.OnResume();
        Platform.OnResume(this);
    }

    protected override void OnNewIntent(Intent? intent)
    {
        base.OnNewIntent(intent);
        Platform.OnNewIntent(intent);
    }
}
