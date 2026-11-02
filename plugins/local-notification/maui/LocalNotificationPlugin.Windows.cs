#if WINDOWS
using Microsoft.Windows.AppNotifications;
using Microsoft.Windows.AppNotifications.Builder;

namespace Napacitor.Plugins.LocalNotification;

public partial class LocalNotificationPlugin
{
    private const string ArgumentIdKey = "napacitor_id";
    private const string ArgumentTitleKey = "napacitor_title";
    private const string ArgumentBodyKey = "napacitor_body";

    /// <summary>订阅点击回调并注册通知管理器。</summary>
    /// <remarks>
    /// Napacitor 模板为未打包应用(WindowsPackageType=None),
    /// 未打包应用必须先显式调用 <c>Register()</c> 才能展示/接收 AppNotification;
    /// 该调用要求 UI 线程,插件在宿主启动阶段被构造,满足此前提。
    /// </remarks>
    private void InitializeWindows()
    {
        AppNotificationManager.Default.NotificationInvoked += OnNotificationInvoked;
        AppNotificationManager.Default.Register();
    }

    /// <summary>立即展示通知;Windows App SDK 不支持计划通知,at 非空时抛错。</summary>
    private void ScheduleWindows(int id, string title, string body, DateTime? at)
    {
        if (at is not null)
        {
            // Windows App SDK 尚未提供计划通知能力:
            // https://github.com/microsoft/WindowsAppSDK/issues/5050
            throw NotImplemented("schedule(at) —— Windows App SDK 不支持计划通知");
        }

        var notification = new AppNotificationBuilder()
            .AddText(title)
            .AddText(body)
            .AddArgument(ArgumentIdKey, id.ToString())
            .AddArgument(ArgumentTitleKey, title)
            .AddArgument(ArgumentBodyKey, body)
            .BuildNotification();

        // Tag 用于按 id 取消/替换;Group 便于在通知中心归类
        notification.Tag = id.ToString();
        notification.Group = "napacitor";

        AppNotificationManager.Default.Show(notification);
    }

    /// <summary>按 Tag(id)取消通知。</summary>
    private async Task CancelWindowsAsync(int id)
    {
        await AppNotificationManager.Default.RemoveByTagAsync(id.ToString());
    }

    /// <summary>用户点击通知(或点击通知内按钮)时的回调,把载荷路由回 JS 监听器。</summary>
    private void OnNotificationInvoked(
        AppNotificationManager sender,
        AppNotificationActivatedEventArgs args)
    {
        var arguments = args.Arguments;
        var id = arguments.TryGetValue(ArgumentIdKey, out var idText) && int.TryParse(idText, out var parsedId)
            ? parsedId
            : 0;
        var title = arguments.TryGetValue(ArgumentTitleKey, out var titleText) ? titleText : string.Empty;
        var body = arguments.TryGetValue(ArgumentBodyKey, out var bodyText) ? bodyText : string.Empty;

        Route(id, title, body);
    }
}
#endif
