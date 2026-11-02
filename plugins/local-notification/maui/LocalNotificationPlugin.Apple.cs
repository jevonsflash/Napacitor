#if IOS || MACCATALYST
using Foundation;
using UserNotifications;

namespace Napacitor.Plugins.LocalNotification;

public partial class LocalNotificationPlugin
{
    /// <summary>注册通知中心代理,处理前台展示与点击回调(每个进程仅可设置一次)。</summary>
    private void InitializeApple()
    {
        UNUserNotificationCenter.Current.Delegate = new LocalNotificationCenterDelegate();
    }

    /// <summary>请求 Alert/Sound/Badge 权限。</summary>
    private async Task<LocalNotificationPermissionResult> RequestPermissionAppleAsync()
    {
        var (approved, error) = await UNUserNotificationCenter.Current
            .RequestAuthorizationAsync(
                UNAuthorizationOptions.Alert | UNAuthorizationOptions.Sound | UNAuthorizationOptions.Badge)
            .ConfigureAwait(false);

        if (error is not null)
        {
            NapacitorLogger.Warn($"LocalNotification:请求通知权限失败: {error.LocalizedDescription}");
        }

        return new LocalNotificationPermissionResult { Granted = approved };
    }

    /// <summary>立即(0.25 秒间隔触发器)或按日历时间发送通知。</summary>
    private void ScheduleApple(int id, string title, string body, DateTime? at)
    {
        var content = new UNMutableNotificationContent
        {
            Title = title,
            Body = body,
            Badge = 1,
        };

        UNNotificationTrigger trigger;
        if (at is not null)
        {
            // 日历触发器按设备本地时区解释各分量,需先把 UTC 转回本地时间
            var local = TimeZoneInfo.ConvertTimeFromUtc(at.Value, TimeZoneInfo.Local);
            trigger = UNCalendarNotificationTrigger.CreateTrigger(
                new NSDateComponents
                {
                    Year = local.Year,
                    Month = local.Month,
                    Day = local.Day,
                    Hour = local.Hour,
                    Minute = local.Minute,
                    Second = local.Second,
                },
                false);
        }
        else
        {
            // 立即发送:时间间隔触发器,间隔必须大于 0 秒
            trigger = UNTimeIntervalNotificationTrigger.CreateTrigger(0.25, false);
        }

        var request = UNNotificationRequest.FromIdentifier(id.ToString(), content, trigger);
        UNUserNotificationCenter.Current.AddNotificationRequest(request, error =>
        {
            if (error is not null)
            {
                NapacitorLogger.Warn(
                    $"LocalNotification:发送通知 {id} 失败: {error.LocalizedDescription}");
            }
        });
    }

    /// <summary>取消已排期与已投递(通知中心残留)的通知。</summary>
    private void CancelApple(int id)
    {
        var center = UNUserNotificationCenter.Current;
        center.RemovePendingNotificationRequests(new[] { id.ToString() });
        center.RemoveDeliveredNotifications(new[] { id.ToString() });
    }
}

/// <summary>
/// 通知中心代理:iOS 与 Mac Catalyst 共享同一 UNUserNotificationCenter 实现。
/// 前台收到通知时仍展示横幅;用户点击通知时把载荷路由回 JS 监听器。
/// </summary>
internal class LocalNotificationCenterDelegate : UNUserNotificationCenterDelegate
{
    // 应用在前台时收到通知:默认会静默,这里改为展示横幅并播放声音
    public override void WillPresentNotification(
        UNUserNotificationCenter center,
        UNNotification notification,
        Action<UNNotificationPresentationOptions> completionHandler)
    {
        var options = OperatingSystem.IsIOSVersionAtLeast(14)
            ? UNNotificationPresentationOptions.Banner | UNNotificationPresentationOptions.Sound
            : UNNotificationPresentationOptions.Alert | UNNotificationPresentationOptions.Sound;
        completionHandler(options);
    }

    // 用户点击通知(应用在后台或被杀死)
    public override void DidReceiveNotificationResponse(
        UNUserNotificationCenter center,
        UNNotificationResponse response,
        Action completionHandler)
    {
        if (response.IsDefaultAction)
        {
            var content = response.Notification.Request.Content;
            int.TryParse(response.Notification.Request.Identifier, out var id);
            LocalNotificationPlugin.Route(id, content.Title, content.Body);
        }

        completionHandler();
    }
}
#endif
