using Foundation;

namespace NapacitorHost.Platforms.MacCatalyst;

[Register("AppDelegate")]
public class AppDelegate : MauiAppDelegate
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();
}
