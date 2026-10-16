using Microsoft.JSInterop;

namespace Napacitor;

/// <summary>
/// JS → C# 的静态桥入口(与 Capacitor Android 的 MessageHandler 角色对应)。
/// JS 原生桥(napacitor-native-bridge.js)通过
/// window.DotNet.invokeMethodAsync('Napacitor', 'NAP_invoke', ...) 调用。
/// 方法名必须在整个 Napacitor 程序集中唯一(JSInvokable 静态调用约定)。
/// </summary>
public static class NapacitorBridge
{
    private static NapacitorRuntime Runtime =>
        NapacitorRuntime.Current ?? throw new NapacitorException(
            NapacitorException.Unavailable,
            "Napacitor 运行时尚未启动 —— 请在 MAUI Blazor 根组件的 OnAfterRenderAsync 中调用 NapacitorRuntime.StartWebAppAsync");

    /// <summary>调用插件方法,返回 {ok, data|error} 结果信封 JSON。</summary>
    [JSInvokable]
    public static Task<string> NAP_invoke(string pluginId, string method, string argsJson) =>
        Runtime.InvokeAsync(pluginId, method, argsJson);

    /// <summary>注册 JS 事件监听器。</summary>
    [JSInvokable]
    public static Task NAP_addListener(string pluginId, string eventName, string callbackId)
    {
        Runtime.Listeners.AddListener(pluginId, eventName, callbackId);
        return Task.CompletedTask;
    }

    /// <summary>移除单个 JS 事件监听器。</summary>
    [JSInvokable]
    public static Task NAP_removeListener(string callbackId)
    {
        Runtime.Listeners.RemoveListener(callbackId);
        return Task.CompletedTask;
    }

    /// <summary>移除插件全部 JS 事件监听器。</summary>
    [JSInvokable]
    public static Task NAP_removeAllListeners(string pluginId)
    {
        Runtime.Listeners.RemoveAllListeners(pluginId);
        return Task.CompletedTask;
    }
}
