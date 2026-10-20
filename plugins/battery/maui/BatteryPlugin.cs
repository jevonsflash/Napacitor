using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.Battery;

/// <summary>电池状态结构(getBatteryInfo 与 batteryStatusChange 事件共用)。</summary>
public class BatteryInfoResult
{
    /// <summary>电量(0.0 - 1.0)。</summary>
    public double BatteryLevel { get; set; }

    /// <summary>是否正在充电(电源非电池即视为充电中)。</summary>
    public bool IsCharging { get; set; }
}

/// <summary>
/// Battery 插件:电量与充电状态(与 @capacitor/battery 对应)。
///
/// 事件管线示范:首个 JS 监听器注册时订阅原生 BatteryInfoChanged
/// (OnListenerAdded),最后一个监听器移除时退订(OnListenerRemoved),
/// 变化经 NotifyListeners 推送给 JS。
/// </summary>
[NapacitorPlugin("Battery")]
public class BatteryPlugin : NapacitorPluginBase
{
    private const string StatusChangeEvent = "batteryStatusChange";

    /// <summary>获取当前电池信息。</summary>
    [NapacitorMethod]
    public Task<BatteryInfoResult> GetBatteryInfo()
    {
        return Task.FromResult(Snapshot());
    }

    /// <summary>首个监听器注册到 batteryStatusChange 后订阅原生事件。
    /// (跨程序集重写 protected internal 成员须降级为 protected —— C# 可访问性规则)</summary>
    protected override void OnListenerAdded(string eventName)
    {
        if (eventName == StatusChangeEvent)
        {
            Microsoft.Maui.Devices.Battery.Default.BatteryInfoChanged += OnBatteryInfoChanged;
        }
    }

    /// <summary>batteryStatusChange 的最后一个监听器移除后退订原生事件。</summary>
    protected override void OnListenerRemoved(string eventName)
    {
        if (eventName == StatusChangeEvent)
        {
            Microsoft.Maui.Devices.Battery.Default.BatteryInfoChanged -= OnBatteryInfoChanged;
        }
    }

    private void OnBatteryInfoChanged(object? sender, BatteryInfoChangedEventArgs e)
    {
        NotifyListeners(StatusChangeEvent, new BatteryInfoResult
        {
            BatteryLevel = Math.Clamp(e.ChargeLevel, 0.0, 1.0),
            IsCharging = e.PowerSource != BatteryPowerSource.Battery,
        });
    }

    private static BatteryInfoResult Snapshot()
    {
        var battery = Microsoft.Maui.Devices.Battery.Default;
        return new BatteryInfoResult
        {
            BatteryLevel = Math.Clamp(battery.ChargeLevel, 0.0, 1.0),
            IsCharging = battery.PowerSource != BatteryPowerSource.Battery,
        };
    }
}
