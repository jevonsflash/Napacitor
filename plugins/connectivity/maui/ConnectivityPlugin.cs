using Microsoft.Maui.Networking;

namespace Napacitor.Plugins.Connectivity;

/// <summary>网络状态。</summary>
public class NetworkStatusResult
{
    public string ConnectionType { get; set; } = "NONE";
    public string NetworkAccess { get; set; } = "NONE";
    public bool IsConnected { get; set; }
}

/// <summary>
/// Connectivity 插件:网络状态检测与监听(封装 MAUI Connectivity API)。
///
/// 事件管线:首个 JS 监听器注册时订阅原生 ConnectivityChanged,
/// 最后一个监听器移除时退订。
/// </summary>
[NapacitorPlugin("Connectivity")]
public class ConnectivityPlugin : NapacitorPluginBase
{
    private const string ChangeEvent = "connectivityChange";

    private static string MapConnectionProfiles(
        IEnumerable<global::Microsoft.Maui.Networking.ConnectionProfile> profiles)
    {
        var list = profiles.ToList();
        if (list.Contains(global::Microsoft.Maui.Networking.ConnectionProfile.Ethernet)) return "ETHERNET";
        if (list.Contains(global::Microsoft.Maui.Networking.ConnectionProfile.WiFi)) return "WIFI";
        if (list.Contains(global::Microsoft.Maui.Networking.ConnectionProfile.Cellular)) return "CELLULAR";
        if (list.Contains(global::Microsoft.Maui.Networking.ConnectionProfile.Bluetooth)) return "BLUETOOTH";
        return list.Count == 0 ? "NONE" : "UNKNOWN";
    }

    private static string MapNetworkAccess(global::Microsoft.Maui.Networking.NetworkAccess access)
    {
        return access switch
        {
            global::Microsoft.Maui.Networking.NetworkAccess.Internet => "INTERNET",
            global::Microsoft.Maui.Networking.NetworkAccess.ConstrainedInternet => "CONSTRAINED_INTERNET",
            global::Microsoft.Maui.Networking.NetworkAccess.Local => "LOCAL",
            global::Microsoft.Maui.Networking.NetworkAccess.None => "NONE",
            _ => "UNKNOWN",
        };
    }

    private static NetworkStatusResult Snapshot()
    {
        var connectivity = global::Microsoft.Maui.Networking.Connectivity.Current;
        return new NetworkStatusResult
        {
            ConnectionType = MapConnectionProfiles(connectivity.ConnectionProfiles),
            NetworkAccess = MapNetworkAccess(connectivity.NetworkAccess),
            IsConnected = connectivity.NetworkAccess != global::Microsoft.Maui.Networking.NetworkAccess.None,
        };
    }

    /// <summary>获取当前网络状态。</summary>
    [NapacitorMethod]
    public Task<NetworkStatusResult> GetStatus()
    {
        return Task.FromResult(Snapshot());
    }

    /// <summary>检查是否有互联网连接。</summary>
    [NapacitorMethod]
    public Task<bool> HasInternetAccess()
    {
        var hasAccess = global::Microsoft.Maui.Networking.Connectivity.Current.NetworkAccess ==
                        global::Microsoft.Maui.Networking.NetworkAccess.Internet;
        return Task.FromResult(hasAccess);
    }

    /// <summary>首个监听器注册到 connectivityChange 后订阅原生事件。</summary>
    protected override void OnListenerAdded(string eventName)
    {
        if (eventName == ChangeEvent)
        {
            global::Microsoft.Maui.Networking.Connectivity.Current.ConnectivityChanged += OnConnectivityChanged;
        }
    }

    /// <summary>connectivityChange 的最后一个监听器移除后退订原生事件。</summary>
    protected override void OnListenerRemoved(string eventName)
    {
        if (eventName == ChangeEvent)
        {
            global::Microsoft.Maui.Networking.Connectivity.Current.ConnectivityChanged -= OnConnectivityChanged;
        }
    }

    private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
    {
        NotifyListeners(ChangeEvent, new NetworkStatusResult
        {
            ConnectionType = MapConnectionProfiles(e.ConnectionProfiles),
            NetworkAccess = MapNetworkAccess(e.NetworkAccess),
            IsConnected = e.NetworkAccess != global::Microsoft.Maui.Networking.NetworkAccess.None,
        });
    }
}
