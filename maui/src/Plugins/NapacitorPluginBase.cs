using System.Text.Json;

namespace Napacitor.Plugins;

/// <summary>
/// Napacitor 插件基类(与 Capacitor Android 的 Plugin 基类对应)。
/// 提供事件通知(原生 → JS)、监听器生命周期钩子与配置访问。
/// </summary>
/// <remarks>
/// 与 Capacitor saveCall / keepAlive 的对应关系(架构差异说明):
/// Capacitor 的方法调用是"消息 + callbackId"模型,方法必须立刻返回,
/// 异步完成或多次回调需要保存 call 对象;Napacitor 的插件方法签名就是
/// Task / ValueTask —— 单次异步完成由 async/await 天然承载(无需 saveCall),
/// 多次回调走事件管线(NotifyListeners + JS addListener,即 keepAlive 的语义)。
/// </remarks>
public abstract class NapacitorPluginBase : INapacitorPlugin
{
    private NapacitorRuntime? _runtime;
    private JsonElement _config;

    /// <summary>运行时(由 PluginRegistry 注入;仅在插件被使用后可用)。</summary>
    protected NapacitorRuntime Runtime =>
        _runtime ?? throw new NapacitorException(
            NapacitorException.Unavailable,
            "插件尚未挂接到 Napacitor 运行时");

    /// <summary>napacitor.config.json 中 plugins.{PluginName} 配置节(可能为空)。</summary>
    protected JsonElement Config => _config;

    /// <summary>
    /// napacitor.config.json 根配置(对应 Capacitor 的 bridge.getConfig();
    /// 与 <see cref="Config"/> 的区别:这是整份配置而非插件自己的节,
    /// 未加载时 ValueKind 为 Undefined)。
    /// </summary>
    protected JsonElement AppConfig => _runtime?.AppConfig ?? default;

    /// <summary>当前平台字符串:android / ios / mac / windows。</summary>
    protected string Platform => NapacitorRuntime.PlatformName;

    /// <summary>插件注册名(默认取类名去掉 "Plugin" 后缀)。</summary>
    public virtual string PluginName
    {
        get
        {
            var name = GetType().Name;
            return name.EndsWith("Plugin", StringComparison.OrdinalIgnoreCase)
                ? name[..^"Plugin".Length]
                : name;
        }
    }

    /// <summary>
    /// 向 Web 派发自定义 DOM 事件(对应 Capacitor 的 bridge.triggerJSEvent),
    /// JS 侧以 window.addEventListener(name, e =&gt; e.detail) 接收。
    /// 插件自身事件优先用 <see cref="NotifyListeners"/>(走插件事件管线,
    /// 可经 <see cref="ListenerCount"/> 惰性订阅原生源)。
    /// </summary>
    protected Task TriggerJSEventAsync(string eventName, string target = "window", string? dataJson = null) =>
        _runtime?.TriggerJSEventAsync(eventName, target, dataJson) ?? Task.CompletedTask;

    /// <summary>便捷重载:任意可序列化对象直接作为事件 detail。</summary>
    protected Task TriggerJSEventAsync(string eventName, object? data) =>
        _runtime?.TriggerJSEventAsync(eventName, data) ?? Task.CompletedTask;

    /// <summary>
    /// 经 WebView 同源通道读取 wwwroot 静态文本(承担 Capacitor iOS 的
    /// localURL(fromWebURL:) 职责:C# 侧按 Web 的 URL 规则访问静态资源)。
    /// 缺失返回 null。
    /// </summary>
    protected Task<string?> ReadAssetTextAsync(string url) =>
        _runtime?.ReadAssetTextAsync(url) ?? Task.FromResult<string?>(null);

    /// <summary>向 JS 发送插件事件(对应 Capacitor Android 的 notifyListeners)。</summary>
    protected void NotifyListeners(string eventName, object? data)
    {
        _runtime?.EmitEventAsync(PluginName, eventName, data).FireAndForget();
    }

    /// <summary>当前事件名的 JS 监听器数量(可用于惰性订阅原生事件源)。</summary>
    protected int ListenerCount(string eventName) =>
        _runtime?.GetListenerCount(PluginName, eventName) ?? 0;

    /// <summary>抛出 NOT_IMPLEMENTED(与 Capacitor 的 unimplemented 对应)。</summary>
    protected NapacitorException NotImplemented(string what) =>
        new(NapacitorException.NotImplemented, $"{PluginName}: {what} 未在此平台实现");

    /// <summary>首个监听器注册到某事件后回调(对应 Capacitor 的 handleOnListenerAdded)。</summary>
    protected internal virtual void OnListenerAdded(string eventName)
    {
    }

    /// <summary>某事件的最后一个监听器被移除后回调(对应 Capacitor 的 handleOnListenerRemoved)。</summary>
    protected internal virtual void OnListenerRemoved(string eventName)
    {
    }

    // ---- 由 PluginRegistry 注入 ----

    internal void Attach(NapacitorRuntime runtime, JsonElement config)
    {
        _runtime = runtime;
        _config = config;
    }
}

/// <summary>“发射后不管”扩展(仅记录失败日志,避免未观察的 Task 异常)。</summary>
internal static class TaskExtensions
{
    public static async void FireAndForget(this Task task)
    {
        try
        {
            await task.ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[Napacitor] 事件发送失败: {ex.Message}");
        }
    }
}
