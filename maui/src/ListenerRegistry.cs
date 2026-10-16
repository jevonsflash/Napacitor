using System.Collections.Concurrent;
using Napacitor.Plugins;

namespace Napacitor;

/// <summary>监听器注册表:callbackId → (插件, 事件名)。管理 JS 侧事件订阅。</summary>
public sealed class ListenerRegistry
{
    private readonly ConcurrentDictionary<string, (string PluginId, string EventName)> _listeners = new();
    private readonly PluginRegistry _plugins;

    internal ListenerRegistry(PluginRegistry plugins)
    {
        _plugins = plugins;
    }

    /// <summary>注册监听器并触发插件生命周期钩子(对应 Capacitor 的 bridge 目标 addListener)。</summary>
    public void AddListener(string pluginId, string eventName, string callbackId)
    {
        var wasEmpty = GetListeners(pluginId, eventName).Count == 0;
        _listeners[callbackId] = (pluginId, eventName);

        if (wasEmpty && _plugins.FindPlugin(pluginId) is NapacitorPluginBase plugin)
        {
            plugin.OnListenerAdded(eventName);
        }
    }

    /// <summary>移除单个监听器;某事件的最后一个监听器被移除时触发钩子。</summary>
    public void RemoveListener(string callbackId)
    {
        if (!_listeners.TryRemove(callbackId, out var entry))
        {
            return;
        }
        NotifyIfEmpty(entry.PluginId, entry.EventName);
    }

    /// <summary>移除插件全部监听器;逐事件触发“最后一个监听器移除”钩子。</summary>
    public void RemoveAllListeners(string pluginId)
    {
        var events = new HashSet<string>(StringComparer.Ordinal);
        foreach (var (callbackId, entry) in _listeners)
        {
            if (string.Equals(entry.PluginId, pluginId, StringComparison.OrdinalIgnoreCase) &&
                _listeners.TryRemove(callbackId, out _))
            {
                events.Add(entry.EventName);
            }
        }
        foreach (var eventName in events)
        {
            NotifyIfEmpty(pluginId, eventName);
        }
    }

    /// <summary>某插件某事件当前监听器数量。</summary>
    public int GetCount(string pluginId, string eventName) =>
        GetListeners(pluginId, eventName).Count;

    /// <summary>取某插件某事件的全部 callbackId(事件发送时遍历)。</summary>
    public IReadOnlyList<string> GetCallbacks(string pluginId, string eventName)
    {
        var result = new List<string>();
        foreach (var (callbackId, entry) in _listeners)
        {
            if (string.Equals(entry.PluginId, pluginId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(entry.EventName, eventName, StringComparison.Ordinal))
            {
                result.Add(callbackId);
            }
        }
        return result;
    }

    private List<string> GetListeners(string pluginId, string eventName) =>
        GetCallbacks(pluginId, eventName).ToList();

    private void NotifyIfEmpty(string pluginId, string eventName)
    {
        if (GetListeners(pluginId, eventName).Count == 0 &&
            _plugins.FindPlugin(pluginId) is NapacitorPluginBase plugin)
        {
            plugin.OnListenerRemoved(eventName);
        }
    }
}
