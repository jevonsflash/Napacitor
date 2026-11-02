using System.Collections.Concurrent;

namespace Napacitor.Plugins.LocalNotification;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>单条本地通知定义。</summary>
public class LocalNotificationSchema
{
    /// <summary>通知标题。</summary>
    public string? Title { get; set; }

    /// <summary>通知正文。</summary>
    public string? Body { get; set; }

    /// <summary>通知唯一 id;省略时由平台自动生成。</summary>
    public int? Id { get; set; }

    /// <summary>计划发送时间(ISO 8601 字符串);省略时立即发送。</summary>
    public string? At { get; set; }
}

/// <summary>schedule() 参数。</summary>
public class LocalNotificationScheduleOptions
{
    /// <summary>要发送的通知数组。</summary>
    public List<LocalNotificationSchema>? Notifications { get; set; }
}

/// <summary>已排期的单条通知。</summary>
public class LocalNotificationScheduled
{
    /// <summary>通知 id(自动生成时为分配值)。</summary>
    public int Id { get; set; }
}

/// <summary>schedule() 返回值。</summary>
public class LocalNotificationScheduleResult
{
    /// <summary>每条通知的最终 id(与入参顺序一致)。</summary>
    public List<LocalNotificationScheduled> Notifications { get; set; } = new();
}

/// <summary>要取消的单条通知。</summary>
public class LocalNotificationCancelSchema
{
    /// <summary>要取消的通知 id。</summary>
    public int? Id { get; set; }
}

/// <summary>cancel() 参数。</summary>
public class LocalNotificationCancelOptions
{
    /// <summary>要取消的通知数组。</summary>
    public List<LocalNotificationCancelSchema>? Notifications { get; set; }
}

/// <summary>requestPermission() 返回值。</summary>
public class LocalNotificationPermissionResult
{
    /// <summary>是否已获得通知权限。</summary>
    public bool Granted { get; set; }
}

/// <summary>notificationReceived 事件的载荷。</summary>
public class LocalNotificationReceivedResult
{
    /// <summary>通知 id(平台无法提供时为 0)。</summary>
    public int Id { get; set; }

    /// <summary>通知标题。</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>通知正文。</summary>
    public string Body { get; set; } = string.Empty;
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// LocalNotification 插件:立即或定时发送本地通知,支持权限请求、取消与点击回调。
///
/// 架构说明(为何多目标):通知必须实现平台回调类型 —— iOS/Mac Catalyst 的
/// <c>UNUserNotificationCenterDelegate</c>、Android 的 <c>BroadcastReceiver</c>、
/// Windows 的 <c>AppNotificationManager.NotificationInvoked</c> ——
/// 这些类型只在平台 TFM 中可用,纯 net10.0 单目标无法引用,
/// 故本插件以 <c>net10.0;net10.0-android;net10.0-ios;net10.0-maccatalyst;
/// net10.0-windows10.0.19041.0</c> 多目标编译(其余 Napacitor 插件均为单目标)。
/// net10.0 目标提供桩实现(全部方法抛 NOT_IMPLEMENTED),保证无工作负载环境仍可编译。
/// </summary>
[NapacitorPlugin("LocalNotification")]
public partial class LocalNotificationPlugin : NapacitorPluginBase
{
    private const string ReceivedEvent = "notificationReceived";

    /// <summary>当前插件实例(供广播接收器 / 通知代理 / 激活回调静态路由)。</summary>
    internal static LocalNotificationPlugin? Instance { get; private set; }

    /// <summary>监听器注册前到达的通知载荷(OnListenerAdded 时统一投递)。</summary>
    private static readonly ConcurrentQueue<LocalNotificationReceivedResult> Pending =
        new();

    private int _nextId = 1;

    public LocalNotificationPlugin()
    {
        Instance = this;
#if ANDROID
        InitializeAndroid();
#elif IOS || MACCATALYST
        InitializeApple();
#elif WINDOWS
        InitializeWindows();
#endif
    }

    /// <summary>请求发送本地通知的权限(Windows 为 no-op,恒 granted)。</summary>
    [NapacitorMethod]
    public Task<LocalNotificationPermissionResult> RequestPermission() =>
        RequestPermissionPlatform();

    /// <summary>立即或定时发送本地通知,返回每条通知的最终 id。</summary>
    [NapacitorMethod]
    public Task<LocalNotificationScheduleResult> Schedule(LocalNotificationScheduleOptions options)
    {
        var notifications = options.Notifications;
        if (notifications is null || notifications.Count == 0)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "LocalNotification:notifications 不能为空");
        }

        var result = new LocalNotificationScheduleResult();
        foreach (var item in notifications)
        {
            var id = item.Id ?? Interlocked.Increment(ref _nextId);
            var title = item.Title ?? string.Empty;
            var body = item.Body ?? string.Empty;
            var at = ParseScheduleTime(item.At);

            SchedulePlatform(id, title, body, at);
            result.Notifications.Add(new LocalNotificationScheduled { Id = id });
        }

        return Task.FromResult(result);
    }

    /// <summary>取消已排期/已展示的通知。</summary>
    [NapacitorMethod]
    public async Task Cancel(LocalNotificationCancelOptions options)
    {
        if (options.Notifications is null)
        {
            return;
        }

        foreach (var item in options.Notifications)
        {
            if (item.Id is not null)
            {
                await CancelPlatform(item.Id.Value).ConfigureAwait(false);
            }
        }
    }

    /// <summary>首个监听器注册到 notificationReceived 后,投递此前缓存的点击载荷。</summary>
    protected override void OnListenerAdded(string eventName)
    {
        if (eventName != ReceivedEvent)
        {
            return;
        }

        while (Pending.TryDequeue(out var payload))
        {
            NotifyListeners(ReceivedEvent, payload);
        }
    }

    /* ── 静态路由(平台回调 → 插件事件管线) ── */

    /// <summary>
    /// 平台回调(通知点击/激活)的静态入口:已有 JS 监听器时立即投递,
    /// 否则入队,待 OnListenerAdded 统一投递。
    /// </summary>
    internal static void Route(int id, string title, string body)
    {
        var payload = new LocalNotificationReceivedResult { Id = id, Title = title, Body = body };
        var instance = Instance;
        if (instance is not null && instance.ListenerCount(ReceivedEvent) > 0)
        {
            instance.NotifyListeners(ReceivedEvent, payload);
            return;
        }

        Pending.Enqueue(payload);
    }

    /* ── 公共辅助 ── */

    /// <summary>解析 ISO 8601 时间串为 UTC DateTime;空串 → null(立即发送)。</summary>
    private static DateTime? ParseScheduleTime(string? at)
    {
        if (string.IsNullOrWhiteSpace(at))
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(
                at,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.RoundtripKind,
                out var parsed))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"LocalNotification:无法解析时间 '{at}'(请使用 ISO 8601 格式,如 '2026-11-02T12:00:00Z')");
        }

        return parsed.UtcDateTime;
    }

    /* ── 平台分发 ── */

    private Task<LocalNotificationPermissionResult> RequestPermissionPlatform()
    {
#if ANDROID
        return RequestPermissionAndroid();
#elif IOS || MACCATALYST
        return RequestPermissionAppleAsync();
#elif WINDOWS
        // Windows 没有通知的运行时权限请求,是否允许由系统设置决定
        return Task.FromResult(new LocalNotificationPermissionResult { Granted = true });
#else
        throw NotImplemented("requestPermission");
#endif
    }

    private void SchedulePlatform(int id, string title, string body, DateTime? at)
    {
#if ANDROID
        ScheduleAndroid(id, title, body, at);
#elif IOS || MACCATALYST
        ScheduleApple(id, title, body, at);
#elif WINDOWS
        ScheduleWindows(id, title, body, at);
#else
        throw NotImplemented("schedule");
#endif
    }

    private Task CancelPlatform(int id)
    {
#if ANDROID
        CancelAndroid(id);
        return Task.CompletedTask;
#elif IOS || MACCATALYST
        CancelApple(id);
        return Task.CompletedTask;
#elif WINDOWS
        return CancelWindowsAsync(id);
#else
        throw NotImplemented("cancel");
#endif
    }
}
