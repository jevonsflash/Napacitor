using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.Haptics;

/// <summary>impact() 参数结构。</summary>
public class HapticsImpactOptions
{
    /// <summary>触觉强度:LIGHT / MEDIUM / HEAVY。</summary>
    public string? Style { get; set; }
}

/// <summary>notification() 参数结构。</summary>
public class HapticsNotificationOptions
{
    /// <summary>通知类型:SUCCESS / WARNING / ERROR。</summary>
    public string? Type { get; set; }
}

/// <summary>vibrate() 参数结构。</summary>
public class HapticsVibrateOptions
{
    /// <summary>振动时长(毫秒)。</summary>
    public int? Duration { get; set; }
}

/// <summary>
/// Haptics 插件:振动反馈(与 @capacitor/haptics 对应)。
/// 基于 MAUI Essentials 的 Vibration 门面实现;不支持振动的平台
/// (如 Windows)为无操作并记录日志。
/// </summary>
[NapacitorPlugin("Haptics")]
public class HapticsPlugin : NapacitorPluginBase
{
    /// <summary>impact 强度 → 振动时长(毫秒)。MAUI 无 Taptic 级别反馈,用时长近似。</summary>
    private static readonly Dictionary<string, int> ImpactDurations =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["LIGHT"] = 10,
            ["MEDIUM"] = 25,
            ["HEAVY"] = 40,
        };

    /// <summary>notification 类型 → 振动时长(毫秒)。</summary>
    private static readonly Dictionary<string, int> NotificationDurations =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["SUCCESS"] = 35,
            ["WARNING"] = 45,
            ["ERROR"] = 60,
        };

    /// <summary>触觉冲击(LIGHT / MEDIUM / HEAVY,默认 MEDIUM)。</summary>
    [NapacitorMethod]
    public Task Impact(HapticsImpactOptions options)
    {
        var style = options.Style ?? "MEDIUM";
        VibrateFor(ImpactDurations.TryGetValue(style, out var ms) ? ms : 25);
        return Task.CompletedTask;
    }

    /// <summary>通知触觉(SUCCESS / WARNING / ERROR,默认 SUCCESS)。</summary>
    [NapacitorMethod]
    public Task Notification(HapticsNotificationOptions options)
    {
        var type = options.Type ?? "SUCCESS";
        VibrateFor(NotificationDurations.TryGetValue(type, out var ms) ? ms : 35);
        return Task.CompletedTask;
    }

    /// <summary>自定义时长振动(默认 60ms)。</summary>
    [NapacitorMethod]
    public Task Vibrate(HapticsVibrateOptions options)
    {
        VibrateFor(options.Duration ?? 60);
        return Task.CompletedTask;
    }

    /// <summary>选择变化触觉(轻微,10ms)。</summary>
    [NapacitorMethod]
    public Task Selection()
    {
        VibrateFor(10);
        return Task.CompletedTask;
    }

    /// <summary>选择开始触觉(与 Selection 同为轻微反馈)。</summary>
    [NapacitorMethod]
    public Task SelectionChanged()
    {
        VibrateFor(10);
        return Task.CompletedTask;
    }

    private static void VibrateFor(int milliseconds)
    {
        var vibration = Vibration.Default;
        if (!vibration.IsSupported)
        {
            System.Diagnostics.Debug.WriteLine(
                $"[Napacitor] 当前平台不支持振动,忽略 {milliseconds}ms 触觉请求");
            return;
        }
        vibration.Vibrate(TimeSpan.FromMilliseconds(milliseconds));
    }
}
