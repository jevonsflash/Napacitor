using Microsoft.Maui.Devices.Sensors;

namespace Napacitor.Plugins.Motion;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>start*() 参数结构。</summary>
public class StartSensorOptions
{
    /// <summary>采样速率:DEFAULT / UI / GAME / FASTEST。</summary>
    public string? Speed { get; set; }
}

/// <summary>传感器支持检测结果。</summary>
public class SensorSupportedResult
{
    public bool Supported { get; set; }
}

/// <summary>三轴读数(加速度计 / 陀螺仪 / 磁力计共用)。</summary>
public class AxisReadingResult
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
}

/// <summary>指南针读数。</summary>
public class CompassReadingResult
{
    /// <summary>磁北方向角(0-360°)。</summary>
    public double HeadingMagnetic { get; set; }
    /// <summary>真北方向角(不支持时为 -1)。</summary>
    public double HeadingTrue { get; set; }
    /// <summary>校准等级:UNKNOWN(平台未提供) / UNRELIABLE / LOW_ACCURACY / MEDIUM_ACCURACY / HIGH_ACCURACY。</summary>
    public string Calibration { get; set; } = "UNKNOWN";
}

/// <summary>气压计读数。</summary>
public class BarometerReadingResult
{
    /// <summary>大气压强(hPa)。</summary>
    public double Pressure { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Motion 插件:统一封装 MAUI 五类传感器
/// (Accelerometer / Gyroscope / Magnetometer / Compass / Barometer)。
///
/// 事件管线:每种传感器独立管理订阅——首个 JS 监听器注册时订阅原生 ReadingChanged,
/// 最后一个监听器移除时退订。
/// </summary>
[NapacitorPlugin("Motion")]
public class MotionPlugin : NapacitorPluginBase
{
    /* ── 事件名常量 ── */
    private const string AccelerometerEvent = "accelerometerReading";
    private const string GyroscopeEvent = "gyroscopeReading";
    private const string MagnetometerEvent = "magnetometerReading";
    private const string CompassEvent = "compassReading";
    private const string BarometerEvent = "barometerReading";

    /* ── 内部订阅状态 ── */
    private bool _accelSubscribed;
    private bool _gyroSubscribed;
    private bool _magSubscribed;
    private bool _compassSubscribed;
    private bool _baroSubscribed;

    /* ── SensorSpeed 映射 ── */
    private static Microsoft.Maui.Devices.Sensors.SensorSpeed MapSpeed(string? speed)
    {
        return (speed?.ToUpperInvariant()) switch
        {
            "UI" => Microsoft.Maui.Devices.Sensors.SensorSpeed.UI,
            "GAME" => Microsoft.Maui.Devices.Sensors.SensorSpeed.Game,
            "FASTEST" => Microsoft.Maui.Devices.Sensors.SensorSpeed.Fastest,
            _ => Microsoft.Maui.Devices.Sensors.SensorSpeed.Default,
        };
    }

    /* ══════════════════════════════════════════════════════════
     *  支持检测
     * ══════════════════════════════════════════════════════════ */

    [NapacitorMethod]
    public Task<SensorSupportedResult> IsAccelerometerSupported()
        => Task.FromResult(new SensorSupportedResult { Supported = Accelerometer.Default.IsSupported });

    [NapacitorMethod]
    public Task<SensorSupportedResult> IsGyroscopeSupported()
        => Task.FromResult(new SensorSupportedResult { Supported = Gyroscope.Default.IsSupported });

    [NapacitorMethod]
    public Task<SensorSupportedResult> IsMagnetometerSupported()
        => Task.FromResult(new SensorSupportedResult { Supported = Magnetometer.Default.IsSupported });

    [NapacitorMethod]
    public Task<SensorSupportedResult> IsCompassSupported()
        => Task.FromResult(new SensorSupportedResult { Supported = Compass.Default.IsSupported });

    [NapacitorMethod]
    public Task<SensorSupportedResult> IsBarometerSupported()
        => Task.FromResult(new SensorSupportedResult { Supported = Barometer.Default.IsSupported });

    /* ══════════════════════════════════════════════════════════
     *  启动 / 停止
     * ══════════════════════════════════════════════════════════ */

    [NapacitorMethod]
    public Task StartAccelerometer(StartSensorOptions options)
    {
        if (!Accelerometer.Default.IsSupported)
            throw new NapacitorException(NapacitorException.Unsupported, "加速度计不受支持");
        Accelerometer.Default.Start(MapSpeed(options.Speed));
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StopAccelerometer()
    {
        if (Accelerometer.Default.IsSupported) Accelerometer.Default.Stop();
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StartGyroscope(StartSensorOptions options)
    {
        if (!Gyroscope.Default.IsSupported)
            throw new NapacitorException(NapacitorException.Unsupported, "陀螺仪不受支持");
        Gyroscope.Default.Start(MapSpeed(options.Speed));
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StopGyroscope()
    {
        if (Gyroscope.Default.IsSupported) Gyroscope.Default.Stop();
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StartMagnetometer(StartSensorOptions options)
    {
        if (!Magnetometer.Default.IsSupported)
            throw new NapacitorException(NapacitorException.Unsupported, "磁力计不受支持");
        Magnetometer.Default.Start(MapSpeed(options.Speed));
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StopMagnetometer()
    {
        if (Magnetometer.Default.IsSupported) Magnetometer.Default.Stop();
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StartCompass(StartSensorOptions options)
    {
        if (!Compass.Default.IsSupported)
            throw new NapacitorException(NapacitorException.Unsupported, "指南针不受支持");
        DefaultCompassOptions.Apply(options);
        Compass.Default.Start(MapSpeed(options.Speed));
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StopCompass()
    {
        if (Compass.Default.IsSupported) Compass.Default.Stop();
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StartBarometer(StartSensorOptions options)
    {
        if (!Barometer.Default.IsSupported)
            throw new NapacitorException(NapacitorException.Unsupported, "气压计不受支持");
        Barometer.Default.Start(MapSpeed(options.Speed));
        return Task.CompletedTask;
    }

    [NapacitorMethod]
    public Task StopBarometer()
    {
        if (Barometer.Default.IsSupported) Barometer.Default.Stop();
        return Task.CompletedTask;
    }

    /* ══════════════════════════════════════════════════════════
     *  事件管线(OnListenerAdded / OnListenerRemoved)
     * ══════════════════════════════════════════════════════════ */

    protected override void OnListenerAdded(string eventName)
    {
        switch (eventName)
        {
            case AccelerometerEvent when !_accelSubscribed:
                Accelerometer.Default.ReadingChanged += OnAccelerometerChanged;
                _accelSubscribed = true;
                break;
            case GyroscopeEvent when !_gyroSubscribed:
                Gyroscope.Default.ReadingChanged += OnGyroscopeChanged;
                _gyroSubscribed = true;
                break;
            case MagnetometerEvent when !_magSubscribed:
                Magnetometer.Default.ReadingChanged += OnMagnetometerChanged;
                _magSubscribed = true;
                break;
            case CompassEvent when !_compassSubscribed:
                Compass.Default.ReadingChanged += OnCompassChanged;
                _compassSubscribed = true;
                break;
            case BarometerEvent when !_baroSubscribed:
                Barometer.Default.ReadingChanged += OnBarometerChanged;
                _baroSubscribed = true;
                break;
        }
    }

    protected override void OnListenerRemoved(string eventName)
    {
        switch (eventName)
        {
            case AccelerometerEvent when _accelSubscribed:
                Accelerometer.Default.ReadingChanged -= OnAccelerometerChanged;
                _accelSubscribed = false;
                break;
            case GyroscopeEvent when !_gyroSubscribed:
                Gyroscope.Default.ReadingChanged -= OnGyroscopeChanged;
                _gyroSubscribed = false;
                break;
            case MagnetometerEvent when _magSubscribed:
                Magnetometer.Default.ReadingChanged -= OnMagnetometerChanged;
                _magSubscribed = false;
                break;
            case CompassEvent when _compassSubscribed:
                Compass.Default.ReadingChanged -= OnCompassChanged;
                _compassSubscribed = false;
                break;
            case BarometerEvent when _baroSubscribed:
                Barometer.Default.ReadingChanged -= OnBarometerChanged;
                _baroSubscribed = false;
                break;
        }
    }

    /* ── 原生事件回调 ── */

    private void OnAccelerometerChanged(object? s, AccelerometerChangedEventArgs e)
    {
        var a = e.Reading.Acceleration;
        NotifyListeners(AccelerometerEvent, new AxisReadingResult { X = a.X, Y = a.Y, Z = a.Z });
    }

    private void OnGyroscopeChanged(object? s, GyroscopeChangedEventArgs e)
    {
        var g = e.Reading.AngularVelocity;
        NotifyListeners(GyroscopeEvent, new AxisReadingResult { X = g.X, Y = g.Y, Z = g.Z });
    }

    private void OnMagnetometerChanged(object? s, MagnetometerChangedEventArgs e)
    {
        var m = e.Reading.MagneticField;
        NotifyListeners(MagnetometerEvent, new AxisReadingResult { X = m.X, Y = m.Y, Z = m.Z });
    }

    private void OnCompassChanged(object? s, CompassChangedEventArgs e)
    {
        // MAUI 10 的 CompassData 仅提供磁北方向角
        NotifyListeners(CompassEvent, new CompassReadingResult
        {
            HeadingMagnetic = e.Reading.HeadingMagneticNorth,
            HeadingTrue = -1,
        });
    }

    private void OnBarometerChanged(object? s, BarometerChangedEventArgs e)
    {
        NotifyListeners(BarometerEvent, new BarometerReadingResult
        {
            Pressure = e.Reading.PressureInHectopascals,
        });
    }
}

/* ── 辅助:指南针默认选项 ── */
internal static class DefaultCompassOptions
{
    public static void Apply(StartSensorOptions options)
    {
        // MAUI Compass 需要指定最小角度变化才触发事件;此处用默认值 0(每次读数都触发)
        // Compass.Default.MinimumSpeedAngle 无法在运行时修改,保留此扩展点
    }
}
