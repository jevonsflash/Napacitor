#if ANDROID
using System.Text.Json;
using Android.App;
using Android.Content;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Storage;

// Android 13(API 33)+ 需要 POST_NOTIFICATIONS 运行时权限;
// RECEIVE_BOOT_COMPLETED 用于设备重启后恢复 AlarmManager 排期。
// 程序集级属性会经 manifest 合并并入宿主应用的 AndroidManifest.xml。
[assembly: UsesPermission(Android.Manifest.Permission.PostNotifications)]
[assembly: UsesPermission(Android.Manifest.Permission.ReceiveBootCompleted)]

namespace Napacitor.Plugins.LocalNotification;

public partial class LocalNotificationPlugin
{
    private const string ChannelId = "napacitor_default";
    private const string ChannelName = "通知";
    private const string ChannelDescription = "Napacitor 本地通知默认渠道";

    internal const string TitleKey = "napacitor_title";
    internal const string BodyKey = "napacitor_body";
    internal const string IdKey = "napacitor_id";

    /// <summary>已排期通知持久化的 Preferences 键(JSON 数组)。</summary>
    private const string ScheduledKey = "napacitor_local_notification_scheduled";

    /// <summary>串行化已排期列表的读写(插件方法与广播接收器可能并发)。</summary>
    private static readonly object ScheduledLock = new();

    /// <summary>冷启动意图只检查一次(进程内首次 Activity 创建),避免重建时重复路由。</summary>
    private bool _launchIntentHandled;

    /// <summary>
    /// 订阅点击通知的到达路径(仅冷启动):
    /// 应用被杀后点击通知,载荷在 Activity.Intent;插件构造早于 Activity 创建,
    /// 故订阅 <c>Platform.ActivityStateChanged</c> 待首个 Activity 就绪后检查。
    /// 热启动(应用在前台,载荷经 OnNewIntent 到达)无插件可订阅的通道 ——
    /// MAUI 的 <c>Platform.OnNewIntent</c> 是仅供 AppActions 的静态方法,
    /// 宿主层转发机制尚未引入,该场景暂不支持(见 README 局限)。
    /// </summary>
    private void InitializeAndroid()
    {
        // 冷启动路径:插件构造早于 Activity 创建,待首个 Activity 就绪后检查其 Intent
        Microsoft.Maui.ApplicationModel.Platform.ActivityStateChanged += OnActivityStateChanged;

        // 若插件初始化时 Activity 已存在(宿主推迟插件初始化的场景),立即检查一次
        HandleLaunchIntent(Microsoft.Maui.ApplicationModel.Platform.CurrentActivity?.Intent);
    }

    private void OnActivityStateChanged(object? sender, ActivityStateChangedEventArgs e)
    {
        if (_launchIntentHandled || e.State != ActivityState.Created)
        {
            return;
        }

        _launchIntentHandled = true;
        HandleLaunchIntent(e.Activity?.Intent);
    }

    /// <summary>解析带通知载荷的启动意图并路由;非通知意图(普通启动)直接忽略。</summary>
    private static void HandleLaunchIntent(Intent? intent)
    {
        if (intent?.Extras is null || !intent.Extras.ContainsKey(TitleKey))
        {
            return;
        }

        var id = intent.GetIntExtra(IdKey, 0);
        var title = intent.GetStringExtra(TitleKey) ?? string.Empty;
        var body = intent.GetStringExtra(BodyKey) ?? string.Empty;
        Route(id, title, body);
    }

    /// <summary>请求 POST_NOTIFICATIONS 权限(API 33+;更低版本恒 granted)。</summary>
    private async Task<LocalNotificationPermissionResult> RequestPermissionAndroid()
    {
        var status = await Permissions.RequestAsync<Permissions.PostNotifications>()
            .ConfigureAwait(false);
        return new LocalNotificationPermissionResult { Granted = status == PermissionStatus.Granted };
    }

    /// <summary>立即展示,或经 AlarmManager 定时展示(参考 AlarmHandler 模式)。</summary>
    private void ScheduleAndroid(int id, string title, string body, DateTime? at)
    {
        var context = Android.App.Application.Context;
        if (at is null)
        {
            ShowNotification(context, id, title, body);
            return;
        }

        var intent = new Intent(context, typeof(LocalNotificationAlarmReceiver));
        intent.PutExtra(TitleKey, title);
        intent.PutExtra(BodyKey, body);
        intent.PutExtra(IdKey, id);

        // requestCode 即通知 id:取消时用同一 id 重建 PendingIntent 即可命中
        var pendingIntent = PendingIntent.GetBroadcast(
            context, id, intent, PendingIntentFlags.UpdateCurrent);
        if (pendingIntent is null)
        {
            return;
        }

        var alarmManager = (AlarmManager?)context.GetSystemService(Context.AlarmService);
        var triggerAtMillis = new DateTimeOffset(at.Value, TimeSpan.Zero).ToUnixTimeMilliseconds();
        alarmManager?.Set(AlarmType.RtcWakeup, triggerAtMillis, pendingIntent);

        // 持久化:设备重启后由 BootReceiver 恢复排期
        AddScheduledEntry(new ScheduledNotificationEntry
        {
            Id = id,
            Title = title,
            Body = body,
            AtUtc = at.Value,
        });
    }

    /// <summary>取消已展示的通知与已排期的闹钟。</summary>
    private void CancelAndroid(int id)
    {
        var context = Android.App.Application.Context;

        GetManager(context).Cancel(id);

        var intent = new Intent(context, typeof(LocalNotificationAlarmReceiver));
        var pendingIntent = PendingIntent.GetBroadcast(
            context, id, intent, PendingIntentFlags.UpdateCurrent);
        var alarmManager = (AlarmManager?)context.GetSystemService(Context.AlarmService);
        if (pendingIntent is not null)
        {
            alarmManager?.Cancel(pendingIntent);
        }

        RemoveScheduledEntry(id);
    }

    /// <summary>
    /// 展示通知(插件与 AlarmReceiver 共用)。
    /// 点击通知启动宿主:意图带 SingleTop|ClearTop,应用被杀死时经
    /// <c>Activity.Intent</c> 冷启动路由(见 <see cref="InitializeAndroid"/>);
    /// 应用已在前台时载荷经 OnNewIntent 到达,暂无插件侧通道(见 README 局限)。
    /// </summary>
    internal static void ShowNotification(Context context, int id, string title, string body)
    {
        var manager = GetManager(context);

        Notification.Builder builder;
        if (OperatingSystem.IsAndroidVersionAtLeast(26))
        {
            builder = new Notification.Builder(context, ChannelId);
        }
        else
        {
            builder = new Notification.Builder(context);
        }

        var launchIntent = BuildLaunchIntent(context, id, title, body);
        var contentIntent = PendingIntent.GetActivity(
            context, id, launchIntent, PendingIntentFlags.UpdateCurrent);

        var icon = context.ApplicationInfo?.Icon ?? 0;
        builder.SetContentTitle(title)
            .SetContentText(body)
            .SetAutoCancel(true);
        if (contentIntent is not null)
        {
            builder.SetContentIntent(contentIntent);
        }
        if (icon != 0)
        {
            builder.SetSmallIcon(icon);
        }

        manager.Notify(id, builder.Build());
    }

    /// <summary>构造点击通知后启动宿主的意图(带标题/正文/id 载荷)。</summary>
    private static Intent BuildLaunchIntent(Context context, int id, string title, string body)
    {
        Intent intent;
        // 基类有同名的 protected Platform 属性,须全限定为 MAUI 的 Platform 类
        var activity = Microsoft.Maui.ApplicationModel.Platform.CurrentActivity;
        if (activity is not null)
        {
            intent = new Intent(context, activity.GetType());
        }
        else
        {
            // 无 Activity(闹钟唤醒后台进程)时回退到包启动意图
            intent = context.PackageManager?.GetLaunchIntentForPackage(context.PackageName ?? string.Empty)
                ?? new Intent(context, typeof(Activity));
        }

        intent.PutExtra(TitleKey, title);
        intent.PutExtra(BodyKey, body);
        intent.PutExtra(IdKey, id);
        intent.SetFlags(ActivityFlags.SingleTop | ActivityFlags.ClearTop);
        return intent;
    }

    /// <summary>取 NotificationManager(惰性创建渠道,仅 API 26+)。</summary>
    private static NotificationManager GetManager(Context context)
    {
        var manager = (NotificationManager)context.GetSystemService(Context.NotificationService)!;
        if (OperatingSystem.IsAndroidVersionAtLeast(26))
        {
            manager.CreateNotificationChannel(new NotificationChannel(
                ChannelId, ChannelName, NotificationImportance.Default)
            {
                Description = ChannelDescription,
            });
        }

        return manager;
    }

    /* ── 已排期通知持久化(设备重启后由 BootReceiver 恢复) ── */

    /// <summary>读取已排期列表(损坏时回退为空列表,避免持久层异常阻塞通知)。</summary>
    private static List<ScheduledNotificationEntry> ReadScheduledEntries()
    {
        var json = Preferences.Default.Get(ScheduledKey, "[]");
        try
        {
            return JsonSerializer.Deserialize<List<ScheduledNotificationEntry>>(json) ?? new();
        }
        catch (JsonException)
        {
            return new();
        }
    }

    private static void SaveScheduledEntries(List<ScheduledNotificationEntry> entries)
    {
        Preferences.Default.Set(ScheduledKey, JsonSerializer.Serialize(entries));
    }

    private static void AddScheduledEntry(ScheduledNotificationEntry entry)
    {
        lock (ScheduledLock)
        {
            var entries = ReadScheduledEntries();
            entries.RemoveAll(e => e.Id == entry.Id);
            entries.Add(entry);
            SaveScheduledEntries(entries);
        }
    }

    internal static void RemoveScheduledEntry(int id)
    {
        lock (ScheduledLock)
        {
            var entries = ReadScheduledEntries();
            if (entries.RemoveAll(e => e.Id == id) > 0)
            {
                SaveScheduledEntries(entries);
            }
        }
    }

    /// <summary>
    /// 设备重启后重新排期(BootReceiver 调用):
    /// 已到期的丢弃,未到期的重建 AlarmManager 闹钟。
    /// </summary>
    internal static void RescheduleAllAfterReboot(Context context)
    {
        List<ScheduledNotificationEntry> entries;
        lock (ScheduledLock)
        {
            entries = ReadScheduledEntries();
        }

        if (entries.Count == 0)
        {
            return;
        }

        var now = DateTime.UtcNow;
        var alarmManager = (AlarmManager?)context.GetSystemService(Context.AlarmService);
        foreach (var entry in entries)
        {
            if (entry.AtUtc <= now)
            {
                RemoveScheduledEntry(entry.Id);
                continue;
            }

            var intent = new Intent(context, typeof(LocalNotificationAlarmReceiver));
            intent.PutExtra(TitleKey, entry.Title);
            intent.PutExtra(BodyKey, entry.Body);
            intent.PutExtra(IdKey, entry.Id);

            var pendingIntent = PendingIntent.GetBroadcast(
                context, entry.Id, intent, PendingIntentFlags.UpdateCurrent);
            if (pendingIntent is null)
            {
                continue;
            }

            var triggerAtMillis = new DateTimeOffset(entry.AtUtc, TimeSpan.Zero).ToUnixTimeMilliseconds();
            alarmManager?.Set(AlarmType.RtcWakeup, triggerAtMillis, pendingIntent);
        }
    }
}

/// <summary>已排期通知的持久化条目。</summary>
internal sealed class ScheduledNotificationEntry
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    /// <summary>计划发送时间(UTC)。</summary>
    public DateTime AtUtc { get; set; }
}

/// <summary>
/// 定时通知的广播接收器:AlarmManager 触发后展示通知。
/// [BroadcastReceiver] 属性经 manifest 合并自动注册进宿主应用。
/// </summary>
[BroadcastReceiver(Enabled = true, Exported = false, Label = "Napacitor Local Notification Receiver")]
public class LocalNotificationAlarmReceiver : BroadcastReceiver
{
    public override void OnReceive(Context? context, Intent? intent)
    {
        if (context is null || intent?.Extras is null)
        {
            return;
        }

        var id = intent.GetIntExtra(LocalNotificationPlugin.IdKey, 0);
        var title = intent.GetStringExtra(LocalNotificationPlugin.TitleKey) ?? string.Empty;
        var body = intent.GetStringExtra(LocalNotificationPlugin.BodyKey) ?? string.Empty;
        LocalNotificationPlugin.ShowNotification(context, id, title, body);

        // 闹钟已触发,从持久化列表中移除,避免重启恢复后重复排期
        LocalNotificationPlugin.RemoveScheduledEntry(id);
    }
}

/// <summary>
/// 设备重启广播接收器:恢复 AlarmManager 排期
/// (BOOT_COMPLETED 在 Android 8.0+ 的隐式广播限制豁免清单中,可 manifest 注册)。
/// </summary>
[BroadcastReceiver(Enabled = true, Exported = false, Label = "Napacitor Local Notification Boot Receiver")]
[IntentFilter(new[] { Intent.ActionBootCompleted })]
public class LocalNotificationBootReceiver : BroadcastReceiver
{
    public override void OnReceive(Context? context, Intent? intent)
    {
        if (context is null || intent?.Action != Intent.ActionBootCompleted)
        {
            return;
        }

        LocalNotificationPlugin.RescheduleAllAfterReboot(context);
    }
}
#endif
