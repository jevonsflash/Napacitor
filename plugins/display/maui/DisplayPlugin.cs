using Microsoft.Maui.Devices;

namespace Napacitor.Plugins.Display;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>getInfo() 与 displayChange 事件共用的屏幕信息(MainDisplayInfo 映射)。</summary>
public class DisplayInfoResult
{
    /// <summary>像素宽度。</summary>
    public double Width { get; set; }

    /// <summary>像素高度。</summary>
    public double Height { get; set; }

    /// <summary>屏幕密度(1x = 1.0,2x = 2.0)。</summary>
    public double Density { get; set; }

    /// <summary>当前方向:portrait / landscape。</summary>
    public string Orientation { get; set; } = string.Empty;

    /// <summary>相对自然方向的旋转角度(0 / 90 / 180 / 270)。</summary>
    public double Rotation { get; set; }

    /// <summary>屏幕刷新率(Hz;平台未知时为 0)。</summary>
    public double RefreshRate { get; set; }
}

/// <summary>setKeepAwake() 参数。</summary>
public class KeepAwakeOptions
{
    public bool KeepAwake { get; set; }
}

/// <summary>lock() 参数。</summary>
public class LockOptions
{
    public string? Orientation { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Display 插件:屏幕信息/变化监听/屏幕常亮/运行时方向锁定
/// (封装 MAUI DeviceDisplay API,见 MS 文档「设备显示信息」)。
///
/// 架构差异说明:MainDisplayInfo / KeepScreenOn / MainDisplayInfoChanged
/// 均为 MAUI Essentials 的跨平台 API,直接调用;运行时方向锁定
/// (lock / unlock)在 MAUI 没有跨平台 API —— Android 经反射设置
/// Activity.RequestedOrientation,iOS/Mac Catalyst 经反射调用
/// UIDevice.SetValueForKey("orientation") + AttemptRotationToDeviceOrientation
/// (插件以 net10.0 编译,不引用平台绑定程序集),Windows 无此能力,
/// 抛 NOT_IMPLEMENTED。
/// </summary>
[NapacitorPlugin("Display")]
public class DisplayPlugin : NapacitorPluginBase
{
    private const string DisplayChangeEvent = "displayChange";

    /// <summary>获取当前屏幕信息。</summary>
    [NapacitorMethod]
    public Task<DisplayInfoResult> GetInfo()
    {
        return Task.FromResult(Snapshot());
    }

    /// <summary>设置屏幕是否保持常亮(阻止设备锁屏/熄屏)。</summary>
    [NapacitorMethod]
    public Task SetKeepAwake(KeepAwakeOptions options)
    {
        DeviceDisplay.Current.KeepScreenOn = options.KeepAwake;
        return Task.CompletedTask;
    }

    /// <summary>锁定屏幕方向(portrait / landscape)。</summary>
    [NapacitorMethod]
    public Task Lock(LockOptions options)
    {
        SetOrientation(RequireOrientation(options.Orientation));
        return Task.CompletedTask;
    }

    /// <summary>解锁方向,回落到系统/清单的全局设置。</summary>
    [NapacitorMethod]
    public Task Unlock()
    {
        SetOrientation(null);
        return Task.CompletedTask;
    }

    /// <summary>首个监听器注册到 displayChange 后订阅原生事件。
    /// (跨程序集重写 protected internal 成员须降级为 protected —— C# 可访问性规则)</summary>
    protected override void OnListenerAdded(string eventName)
    {
        if (eventName == DisplayChangeEvent)
        {
            DeviceDisplay.Current.MainDisplayInfoChanged += OnDisplayInfoChanged;
        }
    }

    /// <summary>displayChange 的最后一个监听器移除后退订原生事件。</summary>
    protected override void OnListenerRemoved(string eventName)
    {
        if (eventName == DisplayChangeEvent)
        {
            DeviceDisplay.Current.MainDisplayInfoChanged -= OnDisplayInfoChanged;
        }
    }

    private void OnDisplayInfoChanged(object? sender, DisplayInfoChangedEventArgs e)
    {
        NotifyListeners(DisplayChangeEvent, Snapshot());
    }

    /* ── 屏幕信息 ── */

    private static DisplayInfoResult Snapshot()
    {
        var display = DeviceDisplay.Current.MainDisplayInfo;
        return new DisplayInfoResult
        {
            Width = display.Width,
            Height = display.Height,
            Density = display.Density,
            Orientation = display.Orientation switch
            {
                DisplayOrientation.Portrait => "portrait",
                DisplayOrientation.Landscape => "landscape",
                // Windows 等平台恒返回 Unknown:按宽高推断实际方向
                _ => display.Width >= display.Height ? "landscape" : "portrait",
            },
            Rotation = (double)display.Rotation * 90.0,
            RefreshRate = display.RefreshRate,
        };
    }

    /* ── 方向锁定 ── */

    /// <summary>按平台分发方向锁定;orientation 为 null 表示解锁。</summary>
    private static void SetOrientation(string? orientation)
    {
        if (OperatingSystem.IsAndroid())
        {
            SetAndroidOrientation(orientation);
            return;
        }
        if (OperatingSystem.IsIOS() || OperatingSystem.IsMacCatalyst())
        {
            SetIosOrientation(orientation);
            return;
        }
        if (OperatingSystem.IsWindows())
        {
            throw new NapacitorException(
                NapacitorException.NotImplemented,
                "Display: Windows 不支持运行时锁定屏幕方向(请调整窗口尺寸或使用系统显示设置)");
        }
        throw new NapacitorException(
            NapacitorException.Unsupported,
            "Display: 当前平台不支持运行时锁定屏幕方向");
    }

    /// <summary>
    /// Android:设置 Activity.RequestedOrientation(Portrait / Landscape /
    /// Unspecified)。插件以 net10.0 编译(不引用 Mono.Android),平台 API
    /// 经反射访问;Mono.Android 与 Microsoft.Maui.Essentials 在 Android
    /// 宿主中必然已加载。Unspecified 解锁并回落到清单的全局设置。
    /// </summary>
    private static void SetAndroidOrientation(string? orientation)
    {
        var platformType = Type.GetType(
            "Microsoft.Maui.ApplicationModel.Platform, Microsoft.Maui.Essentials")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 MAUI Platform 类型");
        var activity = platformType.GetProperty("CurrentActivity")?.GetValue(null)
            ?? throw new NapacitorException(
                NapacitorException.Unavailable, "Display: 当前没有 Activity,无法锁定方向");
        var enumType = Type.GetType("Android.Content.PM.ScreenOrientation, Mono.Android")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 ScreenOrientation 枚举");
        var name = orientation switch
        {
            null => "Unspecified",
            "portrait" => "Portrait",
            _ => "Landscape",
        };
        var prop = activity.GetType().GetProperty("RequestedOrientation")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 Activity.RequestedOrientation");
        prop.SetValue(activity, Enum.Parse(enumType, name));
    }

    /// <summary>
    /// iOS / Mac Catalyst:UIDevice.SetValueForKey("orientation") +
    /// UIViewController.AttemptRotationToDeviceOrientation()(Xamarin 遗留的
    /// 运行时方向机制)。iOS 16+ 在部分场景下不生效;需要硬性锁定方向时,
    /// 应把目标方向声明在 Info.plist 的 UISupportedInterfaceOrientations 中
    /// (iPad 还需 UIRequiresFullScreen = YES)。
    /// </summary>
    private static void SetIosOrientation(string? orientation)
    {
        // UIInterfaceOrientation:Unknown=0 Portrait=1 PortraitUpsideDown=2
        // LandscapeLeft=3 LandscapeRight=4;Unknown(0)即解锁,回落到自动旋转
        var value = orientation switch
        {
            null => 0,
            "portrait" => 1,
            _ => 4,
        };

        var deviceType = ResolvePlatformType("UIKit.UIDevice")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 UIDevice 类型");
        var device = deviceType.GetProperty("CurrentDevice")?.GetValue(null)
            ?? throw new NapacitorException(
                NapacitorException.Unavailable, "Display: 当前没有 UIDevice");
        var nsNumberType = ResolvePlatformType("Foundation.NSNumber")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 NSNumber 类型");
        var nsStringType = ResolvePlatformType("Foundation.NSString")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 NSString 类型");

        var number = nsNumberType.GetMethod("FromInt32")?.Invoke(null, new object[] { value })
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 找不到 NSNumber.FromInt32");
        var key = Activator.CreateInstance(nsStringType, "orientation")
            ?? throw new NapacitorException(
                NapacitorException.Error, "Display: 无法构造 NSString");

        device.GetType().GetMethod("SetValueForKey")?.Invoke(device, new[] { number, key });

        var vcType = ResolvePlatformType("UIKit.UIViewController");
        vcType?.GetMethod("AttemptRotationToDeviceOrientation")?.Invoke(null, null);
    }

    /// <summary>iOS 与 Mac Catalyst 的绑定程序集名不同(Xamarin.iOS / Xamarin.MacCatalyst),依次尝试。</summary>
    private static Type? ResolvePlatformType(string fullName) =>
        Type.GetType($"{fullName}, Xamarin.iOS")
        ?? Type.GetType($"{fullName}, Xamarin.MacCatalyst");

    /* ── 参数校验 ── */

    private static string RequireOrientation(string? orientation) =>
        orientation switch
        {
            "portrait" => "portrait",
            "landscape" => "landscape",
            _ => throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "Display:orientation 必须是 'portrait' 或 'landscape'"),
        };
}
