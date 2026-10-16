using System.Reflection;
using System.Text.Json;
using Microsoft.JSInterop;

namespace Napacitor;

/// <summary>Web 应用启动选项。</summary>
public sealed class WebAppOptions
{
    /// <summary>Web 应用入口脚本(覆盖 wwwroot/napacitor.entries.json)。</summary>
    public IReadOnlyList<string>? Entries { get; init; }
}

/// <summary>
/// Napacitor 运行时(与 Capacitor Android 的 Bridge / WebViewLocalServer 角色对应)。
/// 由 MAUI Blazor 宿主的根组件调用 <see cref="StartWebAppAsync"/> 启动:
/// 发现插件 → 注入原生桥 → 加载配置 → 按序导入 Web 应用入口脚本。
/// </summary>
public sealed class NapacitorRuntime
{
    /// <summary>运行时版本(与 @napacitor/core 的 version 保持一致)。</summary>
    public const string Version = "0.1.0";

    private static NapacitorRuntime? _current;

    /// <summary>当前运行时实例(未启动时为 null)。</summary>
    public static NapacitorRuntime? Current => Volatile.Read(ref _current);

    private readonly PluginRegistry _plugins;
    private readonly ListenerRegistry _listeners;

    private IJSRuntime? _js;
    private JsonElement _appConfig;
    private int _started;

    /// <summary>创建运行时实例(宿主一般无需直接调用,见 <see cref="StartAsync"/>)。</summary>
    public NapacitorRuntime()
    {
        _plugins = new PluginRegistry(this);
        _listeners = new ListenerRegistry(_plugins);
    }

    /// <summary>
    /// 便捷入口:创建运行时并启动 Web 应用(幂等)。
    /// 宿主根组件在 OnAfterRenderAsync(firstRender) 中调用:
    /// <code>await NapacitorRuntime.StartAsync(JS);</code>
    /// </summary>
    public static async Task StartAsync(IJSRuntime js, WebAppOptions? options = null)
    {
        var runtime = Current;
        if (runtime is null)
        {
            runtime = new NapacitorRuntime();
        }
        await runtime.StartWebAppAsync(js, options);
    }

    /// <summary>监听器注册表。</summary>
    public ListenerRegistry Listeners => _listeners;

    /// <summary>当前平台字符串:android / ios / mac / windows。</summary>
    public static string PlatformName =>
        OperatingSystem.IsAndroid() ? "android" :
        OperatingSystem.IsIOS() ? "ios" :
        OperatingSystem.IsMacCatalyst() ? "mac" :
        OperatingSystem.IsWindows() ? "windows" :
        "unknown";

    /// <summary>
    /// 启动 Web 应用(幂等)。宿主根组件在 OnAfterRenderAsync(firstRender) 中调用。
    /// </summary>
    public async Task StartWebAppAsync(IJSRuntime js, WebAppOptions? options = null)
    {
        if (Interlocked.Exchange(ref _started, 1) == 1)
        {
            return;
        }

        _js = js;
        _current = this;

        // ① 反射发现插件(对应 Capacitor Android 注解处理器生成的插件清单)
        _plugins.DiscoverPlugins();

        // ② 注入 NapacitorNative 平台信息 + 原生桥(native-bridge)脚本
        await InjectNativeBridgeAsync(js);

        // ③ 读取 napacitor.config.json(由 nap copy 拷入 wwwroot;缺失容忍)
        await LoadAppConfigAsync(js);

        // ④ 按序导入 Web 应用入口脚本
        var entries = options?.Entries ?? await LoadEntriesAsync(js);
        foreach (var entry in entries)
        {
            try
            {
                await js.InvokeAsync<IJSObjectReference>("import", entry);
            }
            catch (JSException ex)
            {
                throw new NapacitorException(
                    NapacitorException.Error,
                    $"导入入口脚本 {entry} 失败:{ex.Message}", ex);
            }
        }
    }

    /// <summary>向 JS 发送插件事件:序列化后经 NapacitorNative.__emit 分发。</summary>
    public async Task EmitEventAsync(string pluginId, string eventName, object? data)
    {
        var js = _js;
        if (js is null)
        {
            return;
        }

        var dataJson = data is null ? "null" : JsonSerializer.Serialize(data, NapacitorJson.Options);
        foreach (var callbackId in _listeners.GetCallbacks(pluginId, eventName))
        {
            try
            {
                await js.InvokeVoidAsync("NapacitorNative.__emit", callbackId, dataJson);
            }
            catch (JSException ex)
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[Napacitor] 事件 {pluginId}.{eventName} 分发失败:{ex.Message}");
            }
        }
    }

    /// <summary>某插件某事件的 JS 监听器数量(供插件惰性订阅)。</summary>
    public int GetListenerCount(string pluginId, string eventName) =>
        _listeners.GetCount(pluginId, eventName);

    /// <summary>napacitor.config.json 中 plugins.{pluginId} 配置节。</summary>
    internal JsonElement GetPluginConfig(string pluginId)
    {
        if (_appConfig.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in _appConfig.EnumerateObject())
            {
                if (string.Equals(prop.Name, "plugins", StringComparison.OrdinalIgnoreCase))
                {
                    foreach (var plugin in prop.Value.EnumerateObject())
                    {
                        if (string.Equals(plugin.Name, pluginId, StringComparison.OrdinalIgnoreCase))
                        {
                            return plugin.Value;
                        }
                    }
                }
            }
        }
        return default;
    }

    /// <summary>插件调用入口(由 NapacitorBridge 静态转发)。</summary>
    internal Task<string> InvokeAsync(string pluginId, string method, string argsJson) =>
        _plugins.InvokeAsync(pluginId, method, argsJson);

    /// <summary>插件名清单(注入 JS 供 isPluginAvailable 同步判定)。</summary>
    internal IReadOnlyCollection<string> PluginNames => _plugins.PluginNames;

    /// <summary>
    /// 注入原生桥:先以初始化桩安装 window.NapacitorNative(队列暂存早期事件),
    /// 再 eval 内嵌的 napacitor-native-bridge.js(安装 window.Napacitor 并接管 __emit)。
    /// </summary>
    private async Task InjectNativeBridgeAsync(IJSRuntime js)
    {
        var pluginList = string.Join(
            ",",
            PluginNames.Select(p => JsonSerializer.Serialize(p, NapacitorJson.Options)));

        var initStub =
            $"(function(){{" +
            $"if(window.NapacitorNative){{return;}}" +
            $"window.NapacitorNative={{" +
            $"platform:{JsonSerializer.Serialize(PlatformName)}," +
            $"version:'{Version}'," +
            $"plugins:[{pluginList}]," +
            $"__pending:[]," +
            $"__emit:function(cb,json){{this.__pending.push({{callbackId:cb,dataJson:json}});}}," +
            $"__fetchText:function(){{return Promise.resolve(null);}}" +
            $"}};" +
            $"}})();";

        await js.InvokeVoidAsync("eval", initStub);

        var bridge = ReadEmbeddedBridge();
        await js.InvokeVoidAsync("eval", bridge);
    }

    /// <summary>读取内嵌原生桥脚本(napacitor-native-bridge.js)。</summary>
    private static string ReadEmbeddedBridge()
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var stream = assembly.GetManifestResourceStream("napacitor-native-bridge.js")
            ?? throw new NapacitorException(
                NapacitorException.Error,
                "内嵌资源 napacitor-native-bridge.js 缺失(请先运行 npm run sync:native-bridge)");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    /// <summary>经 __fetchText 读取 wwwroot 下的 napacitor.config.json。</summary>
    private async Task LoadAppConfigAsync(IJSRuntime js)
    {
        var json = await FetchTextAsync(js, "napacitor.config.json");
        if (string.IsNullOrWhiteSpace(json))
        {
            return;
        }
        try
        {
            using var doc = JsonDocument.Parse(json);
            _appConfig = doc.RootElement.Clone();
        }
        catch (JsonException ex)
        {
            System.Diagnostics.Debug.WriteLine($"[Napacitor] napacitor.config.json 解析失败:{ex.Message}");
        }
    }

    /// <summary>读取 napacitor.entries.json(nap copy 写入的入口脚本清单)。</summary>
    private static async Task<IReadOnlyList<string>> LoadEntriesAsync(IJSRuntime js)
    {
        var json = await FetchTextAsync(js, "napacitor.entries.json");
        if (string.IsNullOrWhiteSpace(json))
        {
            return Array.Empty<string>();
        }
        try
        {
            var entries = JsonSerializer.Deserialize<List<string>>(json, NapacitorJson.Options);
            return entries ?? new List<string>();
        }
        catch (JsonException)
        {
            return Array.Empty<string>();
        }
    }

    /// <summary>调用 JS 侧 __fetchText 助手读取同源静态文本(缺失返回 null)。</summary>
    private static async Task<string?> FetchTextAsync(IJSRuntime js, string url)
    {
        try
        {
            var result = await js.InvokeAsync<string?>("NapacitorNative.__fetchText", url);
            return result;
        }
        catch (JSException)
        {
            return null;
        }
    }
}
