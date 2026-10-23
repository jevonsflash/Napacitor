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

    /// <summary>
    /// napacitor.config.json 根配置(对应 Capacitor 的 bridge.getConfig())。
    /// 配置未加载或文件缺失时 <see cref="JsonElement.ValueKind"/> 为
    /// <see cref="JsonValueKind.Undefined"/>,按需判断取值。
    /// </summary>
    public JsonElement AppConfig => _appConfig;

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
        NapacitorLogger.Info($"① 插件发现完成:{string.Join(",", PluginNames)}");

        // ② 注入 NapacitorNative 平台信息 + 原生桥(native-bridge)脚本
        await InjectNativeBridgeAsync(js);
        NapacitorLogger.Info("② 原生桥注入完成");

        // ③ 读取 napacitor.config.json(由 nap copy 拷入 wwwroot;缺失容忍),
        //    应用 loggingBehavior 并按需打开 JS console 转发
        await LoadAppConfigAsync(js);
        await EnableJsLogForwardingAsync(js);
        NapacitorLogger.Info("③ 应用配置加载完成(loggingBehavior 行为已应用)");

        // ④ 按序导入 Web 应用入口脚本
        var entries = options?.Entries ?? await LoadEntriesAsync(js);
        NapacitorLogger.Info($"④ 入口清单:{string.Join(",", entries)}");
        foreach (var rawEntry in entries)
        {
            var entry = NormalizeEntry(rawEntry);
            try
            {
                await js.InvokeAsync<IJSObjectReference>("import", entry);
                NapacitorLogger.Info($"④ 已导入入口脚本 {entry}");
            }
            catch (JSException ex)
            {
                NapacitorLogger.Warn($"④ 导入 {entry} 失败:{ex.Message}");
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
                NapacitorLogger.Warn($"事件 {pluginId}.{eventName} 分发失败:{ex.Message}");
            }
        }
    }

    /// <summary>某插件某事件的 JS 监听器数量(供插件惰性订阅)。</summary>
    public int GetListenerCount(string pluginId, string eventName) =>
        _listeners.GetCount(pluginId, eventName);

    /// <summary>
    /// 向 Web 派发自定义 DOM 事件(对应 Capacitor 的 bridge.triggerJSEvent):
    /// 在 window / document 上 dispatchEvent(new CustomEvent(…))。
    /// dataJson 须为序列化的 JSON 字符串(与 Capacitor 同约定),JS 侧经
    /// JSON.parse 后作为事件 detail;解析失败时以原始字符串传入。
    /// 插件自身的原生事件请优先用 NotifyListeners(插件事件管线);
    /// 此通道面向插件之外的原生 → Web 广播(宿主代码、后台任务通知前端等)。
    /// </summary>
    public async Task TriggerJSEventAsync(string eventName, string target = "window", string? dataJson = null)
    {
        var js = _js;
        if (js is null)
        {
            return;
        }
        try
        {
            await js.InvokeVoidAsync("eval", BuildJSEventScript(eventName, target, dataJson));
        }
        catch (JSException ex)
        {
            NapacitorLogger.Warn($"事件 {eventName} 派发失败:{ex.Message}");
        }
    }

    /// <summary>
    /// TriggerJSEventAsync 的便捷重载:任意可序列化对象直接作为事件
    /// detail(target 取 window),内部序列化后走主签名。
    /// </summary>
    public Task TriggerJSEventAsync(string eventName, object? data)
    {
        var dataJson = data is null ? null : JsonSerializer.Serialize(data, NapacitorJson.Options);
        return TriggerJSEventAsync(eventName, "window", dataJson);
    }

    /// <summary>
    /// 构造事件派发脚本。事件名与数据均经 JSON 序列化为合法 JS 字符串字面量
    /// 后嵌入 —— 用户数据只成为字面量、不参与代码语义(杜绝注入);
    /// detail 的 JSON.parse 失败时以原始字符串传入;整段 try/catch,
    /// 派发异常不打断原生流程。
    /// </summary>
    private static string BuildJSEventScript(string eventName, string target, string? dataJson)
    {
        var nameLiteral = JsonSerializer.Serialize(eventName, NapacitorJson.Options);
        var dataLiteral = dataJson is null ? null : JsonSerializer.Serialize(dataJson, NapacitorJson.Options);
        var targetExpr = string.Equals(target, "document", StringComparison.OrdinalIgnoreCase)
            ? "document"
            : "window";
        var detailStmt = dataLiteral is null
            ? string.Empty
            : "var d=" + dataLiteral + ";try{d=JSON.parse(d)}catch(e){}o.detail=d;";
        return
            "(function(){" +
            "try{" +
            "var o={};" +
            detailStmt +
            targetExpr + ".dispatchEvent(new CustomEvent(" + nameLiteral + ",o));" +
            "}catch(e){}" +
            "})();";
    }

    /// <summary>
    /// 经 WebView 同源通道读取 wwwroot 静态文本(承担 Capacitor iOS
    /// localURL(fromWebURL:) 的职责:C# 侧按 Web 的 URL 规则访问静态资源;
    /// 相对路径以 wwwroot 为根,Android 等资产打包进 apk 的平台同样可读)。
    /// 资源缺失或读取失败返回 null。
    /// </summary>
    public Task<string?> ReadAssetTextAsync(string url)
    {
        var js = _js;
        return js is null ? Task.FromResult<string?>(null) : FetchTextAsync(js, url);
    }

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
            $"log:false," +
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
            var root = doc.RootElement.Clone();
            _appConfig = root;
            ApplyLoggingBehavior(root);
        }
        catch (JsonException ex)
        {
            NapacitorLogger.Warn($"napacitor.config.json 解析失败:{ex.Message}");
        }
    }

    /// <summary>应用配置根对象中的 loggingBehavior(缺失/非法时由日志器回退 Debug)。</summary>
    private static void ApplyLoggingBehavior(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Object &&
            root.TryGetProperty("loggingBehavior", out var value) &&
            value.ValueKind == JsonValueKind.String)
        {
            NapacitorLogger.Configure(value.GetString());
        }
    }

    /// <summary>
    /// loggingBehavior 允许输出时,打开原生桥的 JS console 转发开关
    /// (NapacitorNative.log,见 napacitor-native-bridge 的 console 补丁)。
    /// 置位发生在 ④ 导入入口脚本之前,Web 应用的 console 输出即可被转发。
    /// </summary>
    private static async Task EnableJsLogForwardingAsync(IJSRuntime js)
    {
        if (!NapacitorLogger.IsEnabled)
        {
            return;
        }
        try
        {
            await js.InvokeVoidAsync(
                "eval", "window.NapacitorNative&&(window.NapacitorNative.log=true)");
        }
        catch (JSException ex)
        {
            NapacitorLogger.Warn($"打开 JS console 转发失败:{ex.Message}");
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

    /// <summary>
    /// 入口脚本路径 → ES 模块说明符:Blazor JSInterop 的 import 仅把 "./" 前缀解析为
    /// 相对 document.baseURI 的 URL,裸文件名会被 WebKit 判为非法模块名(非法 URL)。
    /// </summary>
    private static string NormalizeEntry(string entry) =>
        entry.StartsWith('/') || entry.StartsWith("./") || entry.StartsWith("../")
            || Uri.TryCreate(entry, UriKind.Absolute, out _)
            ? entry
            : $"./{entry}";

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
