using System.Text.Json;

namespace Napacitor.Plugins;

/// <summary>
/// Napacitor 插件基类(与 Capacitor Android 的 Plugin 基类对应)。
/// 提供事件通知(原生 → JS)、监听器生命周期钩子与配置访问。
/// </summary>
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
