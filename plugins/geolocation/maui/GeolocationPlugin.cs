using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices.Sensors;

namespace Napacitor.Plugins.Geolocation;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>getCurrentPosition / watchPosition 参数。</summary>
public class GeolocationPositionOptions
{
    /// <summary>高精度模式(映射 GeolocationAccuracy.Best)。</summary>
    public bool? EnableHighAccuracy { get; set; }

    /// <summary>最大等待时长(毫秒,默认 10000;须为正数)。</summary>
    public int? Timeout { get; set; }
}

/// <summary>GPS 坐标(与 Capacitor Geolocation 的 coords 同形)。</summary>
public class GeolocationCoordsResult
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? Accuracy { get; set; }
    public double? Altitude { get; set; }
    public double? AltitudeAccuracy { get; set; }
    public double? Heading { get; set; }
    public double? Speed { get; set; }
}

/// <summary>位置信息。</summary>
public class GeolocationPositionResult
{
    /// <summary>创建时间戳(Unix 毫秒)。</summary>
    public long Timestamp { get; set; }
    public GeolocationCoordsResult Coords { get; set; } = new();
}

/// <summary>watchPosition 返回值。</summary>
public class GeolocationWatchIdResult
{
    public string Id { get; set; } = string.Empty;
}

/// <summary>clearWatch 参数。</summary>
public class GeolocationClearWatchOptions
{
    public string? Id { get; set; }
}

/// <summary>checkPermissions / requestPermissions 返回值。</summary>
public class GeolocationPermissionStatus
{
    public string Location { get; set; } = "prompt";
    public string CoarseLocation { get; set; } = "prompt";
}

/// <summary>watchPosition 的错误事件载荷。</summary>
public class GeolocationWatchError
{
    public string Code { get; set; } = "ERROR";
    public string Message { get; set; } = string.Empty;
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Geolocation 插件:GPS 定位与持续监听(封装 MAUI Geolocation + Permissions API)。
///
/// 事件管线:watchPosition 启动原生前台监听并经 'position' 事件派发读数,
/// 监听失败经 'error' 事件派发;clearWatch 停止(MAUI 仅支持单会话,重复
/// watch 会重启会话并返回新 id)。
/// </summary>
[NapacitorPlugin("Geolocation")]
public class GeolocationPlugin : NapacitorPluginBase
{
    private const string PositionEvent = "position";
    private const string ErrorEvent = "error";

    private static int _watchSeq;
    private int? _activeWatchId;
    private bool _subscribed;

    /// <summary>获取当前位置(一次性)。</summary>
    [NapacitorMethod]
    public async Task<GeolocationPositionResult> GetCurrentPosition(
        GeolocationPositionOptions options)
    {
        var request = BuildRequest(options);
        var location = await Microsoft.Maui.Devices.Sensors.Geolocation.Default.GetLocationAsync(request);
        if (location is null)
        {
            throw new NapacitorException(
                NapacitorException.Error,
                "无法获取当前位置(可能权限被拒、定位服务未开启或超时)");
        }
        return ToResult(location);
    }

    /// <summary>检查定位权限(LocationWhenInUse)。</summary>
    [NapacitorMethod]
    public async Task<GeolocationPermissionStatus> CheckPermissions()
    {
        var status = await Microsoft.Maui.ApplicationModel.Permissions
            .CheckStatusAsync<Microsoft.Maui.ApplicationModel.Permissions.LocationWhenInUse>();
        var state = MapPermissionState(status);
        return new GeolocationPermissionStatus
        {
            Location = state,
            CoarseLocation = state, // MAUI 未区分粗略/精细粒度,两别名同值
        };
    }

    /// <summary>请求定位权限(平台弹窗)。</summary>
    [NapacitorMethod]
    public async Task<GeolocationPermissionStatus> RequestPermissions()
    {
        var status = await MainThread.InvokeOnMainThreadAsync(
            () => Microsoft.Maui.ApplicationModel.Permissions
                .RequestAsync<Microsoft.Maui.ApplicationModel.Permissions.LocationWhenInUse>());
        var state = MapPermissionState(status);
        return new GeolocationPermissionStatus
        {
            Location = state,
            CoarseLocation = state,
        };
    }

    /// <summary>启动位置监听(MAUI 单会话;重复调用会以新参数重启并返回新 id)。</summary>
    [NapacitorMethod]
    public async Task<GeolocationWatchIdResult> WatchPosition(
        GeolocationPositionOptions options)
    {
        if (!_subscribed)
        {
            var geo = Microsoft.Maui.Devices.Sensors.Geolocation.Default;
            geo.LocationChanged += OnLocationChanged;
            geo.ListeningFailed += OnListeningFailed;
            _subscribed = true;
        }

        if (Microsoft.Maui.Devices.Sensors.Geolocation.Default.IsListeningForeground)
        {
            Microsoft.Maui.Devices.Sensors.Geolocation.Default.StopListeningForeground();
        }

        var accuracy = options.EnableHighAccuracy == true
            ? GeolocationAccuracy.Best
            : GeolocationAccuracy.Default;
        var started = await Microsoft.Maui.Devices.Sensors.Geolocation.Default
            .StartListeningForegroundAsync(new GeolocationListeningRequest(accuracy));
        if (!started)
        {
            throw new NapacitorException(
                NapacitorException.Error,
                "启动位置监听失败(可能权限被拒或定位服务未开启)");
        }

        var id = Interlocked.Increment(ref _watchSeq);
        _activeWatchId = id;
        return new GeolocationWatchIdResult { Id = id.ToString() };
    }

    /// <summary>停止指定的位置监听(id 不匹配时为 no-op)。</summary>
    [NapacitorMethod]
    public Task ClearWatch(GeolocationClearWatchOptions options)
    {
        if (!string.IsNullOrEmpty(options.Id) && options.Id != _activeWatchId?.ToString())
        {
            return Task.CompletedTask;
        }
        _activeWatchId = null;
        if (Microsoft.Maui.Devices.Sensors.Geolocation.Default.IsListeningForeground)
        {
            Microsoft.Maui.Devices.Sensors.Geolocation.Default.StopListeningForeground();
        }
        if (_subscribed)
        {
            var geo = Microsoft.Maui.Devices.Sensors.Geolocation.Default;
            geo.LocationChanged -= OnLocationChanged;
            geo.ListeningFailed -= OnListeningFailed;
            _subscribed = false;
        }
        return Task.CompletedTask;
    }

    /* ── 原生事件回调 ── */

    private void OnLocationChanged(object? sender, GeolocationLocationChangedEventArgs e)
    {
        NotifyListeners(PositionEvent, ToResult(e.Location));
    }

    private void OnListeningFailed(object? sender, GeolocationListeningFailedEventArgs e)
    {
        NotifyListeners(ErrorEvent, new GeolocationWatchError
        {
            Code = NapacitorException.Error,
            Message = $"位置监听失败:{e.Error}",
        });
    }

    /* ── 映射辅助 ── */

    private static GeolocationRequest BuildRequest(GeolocationPositionOptions options)
    {
        var timeout = options.Timeout ?? 10000;
        if (timeout <= 0)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "Geolocation:timeout 需为正数(毫秒)");
        }
        var accuracy = options.EnableHighAccuracy == true
            ? GeolocationAccuracy.Best
            : GeolocationAccuracy.Default;
        return new GeolocationRequest(accuracy, TimeSpan.FromMilliseconds(timeout));
    }

    private static GeolocationPositionResult ToResult(Location location) => new()
    {
        Timestamp = location.Timestamp.ToUnixTimeMilliseconds(),
        Coords = new GeolocationCoordsResult
        {
            Latitude = location.Latitude,
            Longitude = location.Longitude,
            Accuracy = location.Accuracy,
            Altitude = location.Altitude,
            AltitudeAccuracy = location.VerticalAccuracy,
            Heading = location.Course,
            Speed = location.Speed,
        },
    };

    private static string MapPermissionState(PermissionStatus status) => status switch
    {
        PermissionStatus.Granted => "granted",
        PermissionStatus.Denied or PermissionStatus.Disabled or PermissionStatus.Restricted
            => "denied",
        _ => "prompt",
    };
}
