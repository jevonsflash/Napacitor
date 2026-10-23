
(function () {
  'use strict';
  // exports/module 垫片:吸收 tsc CJS 输出的顶层导出语句,隔离为纯脚本。
  var module = { exports: {} };
  var exports = module.exports;

/**
 * napacitor-native-bridge —— 原生桥(与 Capacitor 的 native-bridge.ts 对应)。
 *
 * 本文件零外部 import,单独构建为 dist/native-bridge.js,由 C# 运行时
 * (NapacitorRuntime)作为内嵌资源 eval 注入 WebView,先于 Web 应用脚本执行。
 *
 * 职责:
 *  - 读取 window.NapacitorNative(C# 注入的平台信息与插件清单)
 *  - 安装 window.Napacitor 全局对象(registerPlugin / addListener / ...)
 *  - 提供 __emit: C# → JS 事件分发(加载前事件由初始化桩排入 __pending)
 *  - 提供 __fetchText: C# 侧读取同源静态文本(napacitor.config.json 等)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugin = exports.addListener = exports.invoke = exports.NapacitorException = void 0;
/** Napacitor 运行时程序集名(C# 侧程序集即 Napacitor)。 */
const NAPACITOR_ASSEMBLY = 'Napacitor';
/** 带 code 的异常(与 Capacitor 的 Exception 对应)。 */
class NapacitorException extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'NapacitorException';
        this.code = code;
    }
}
exports.NapacitorException = NapacitorException;
/** callbackId → 监听器。 */
const listeners = new Map();
let listenerSeq = 0;
function getNativeInfo() {
    return window.NapacitorNative;
}
function getDotNet() {
    return window.DotNet;
}
function rejectNoBridge() {
    return Promise.reject(new NapacitorException('BRIDGE_NOT_AVAILABLE', 'window.DotNet 不可用 —— Napacitor 原生桥必须在 .NET MAUI BlazorWebView 中运行'));
}
/** 调用 C# 插件方法,解包信封并抛出 NapacitorException。 */
function invoke(pluginId, methodName, options) {
    const dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
        return rejectNoBridge();
    }
    return dotnet
        .invokeMethodAsync(NAPACITOR_ASSEMBLY, 'NAP_invoke', pluginId, methodName, JSON.stringify(options !== null && options !== void 0 ? options : {}))
        .then((raw) => {
        var _a;
        const envelope = JSON.parse(raw);
        if (envelope.ok) {
            return envelope.data;
        }
        const err = (_a = envelope.error) !== null && _a !== void 0 ? _a : { code: 'ERROR', message: '未知错误' };
        throw new NapacitorException(err.code, err.message);
    });
}
exports.invoke = invoke;
/** 注册事件监听器,返回可 remove 的句柄。 */
async function addListener(pluginId, eventName, listener) {
    const dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
        return rejectNoBridge();
    }
    const callbackId = `${pluginId}.${eventName}.${++listenerSeq}`;
    listeners.set(callbackId, { callbackId, pluginId, eventName, listener });
    await dotnet.invokeMethodAsync(NAPACITOR_ASSEMBLY, 'NAP_addListener', pluginId, eventName, callbackId);
    return {
        remove: async () => {
            await removeListenerById(callbackId);
        },
    };
}
exports.addListener = addListener;
async function removeListenerById(callbackId) {
    if (!listeners.delete(callbackId)) {
        return;
    }
    const dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
        return;
    }
    await dotnet.invokeMethodAsync(NAPACITOR_ASSEMBLY, 'NAP_removeListener', callbackId);
}
async function removeAllListeners(pluginId) {
    const stale = [];
    listeners.forEach((entry) => {
        if (entry.pluginId === pluginId) {
            stale.push(entry.callbackId);
        }
    });
    for (const callbackId of stale) {
        listeners.delete(callbackId);
    }
    const dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
        return;
    }
    await dotnet.invokeMethodAsync(NAPACITOR_ASSEMBLY, 'NAP_removeAllListeners', pluginId);
}
/**
 * C# → JS 事件分发入口。native-bridge 尚未加载时,由 C# 注入的初始化桩
 * 将事件排入 NapacitorNative.__pending,此处安装真实现并回放队列。
 */
function emit(callbackId, dataJson) {
    const entry = listeners.get(callbackId);
    if (!entry) {
        return;
    }
    let data = null;
    try {
        data = dataJson ? JSON.parse(dataJson) : null;
    }
    catch {
        data = dataJson;
    }
    entry.listener(data);
}
function bindNativeBridge() {
    const info = getNativeInfo();
    if (!info) {
        return;
    }
    info.__emit = emit;
    info.__fetchText = async (url) => {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                return null;
            }
            return await res.text();
        }
        catch {
            return null;
        }
    };
    // 回放加载前到达的事件
    const pending = info.__pending;
    if (pending && pending.length > 0) {
        const queued = pending.splice(0, pending.length);
        for (const item of queued) {
            emit(item.callbackId, item.dataJson);
        }
    }
    installConsoleForwarding();
}
/** console 补丁是否已安装(模块内仅装一次)。 */
let consoleForwarded = false;
/**
 * 安装 console → 原生日志转发(与 Capacitor 的 console 重定向对应)。
 * 仅原生环境安装(Web/PWA 不动 console);本地输出始终保留;
 * NapacitorNative.log === true(napacitor.config.json 的 loggingBehavior
 * 允许输出,C# 读取配置后置位)后开始转发;转发 fire-and-forget,失败静默。
 */
function installConsoleForwarding() {
    if (consoleForwarded || getNativeInfo() === undefined) {
        return;
    }
    consoleForwarded = true;
    const nativeConsole = console;
    const forward = (level, original) => (...args) => {
        original.apply(nativeConsole, args);
        const info = getNativeInfo();
        const dotnet = getDotNet();
        if (!info || info.log !== true || !dotnet) {
            return;
        }
        try {
            const text = args.map(stringifyArg).join(' ');
            void dotnet
                .invokeMethodAsync(NAPACITOR_ASSEMBLY, 'NAP_log', level, text)
                .catch(() => undefined);
        }
        catch {
            // 转发失败静默,不影响本地输出
        }
    };
    console.log = forward('info', nativeConsole.log);
    console.info = forward('info', nativeConsole.info);
    console.debug = forward('debug', nativeConsole.debug);
    console.warn = forward('warn', nativeConsole.warn);
    console.error = forward('error', nativeConsole.error);
}
/** console 参数 → 文本(对象 JSON 序列化,不可序列化时退回 String)。 */
function stringifyArg(arg) {
    var _a;
    if (typeof arg === 'string') {
        return arg;
    }
    try {
        return (_a = JSON.stringify(arg)) !== null && _a !== void 0 ? _a : String(arg);
    }
    catch {
        return String(arg);
    }
}
function isNativePlatform() {
    return getNativeInfo() !== undefined;
}
function getPlatform() {
    const info = getNativeInfo();
    return info ? info.platform : 'web';
}
function isPluginAvailable(name) {
    const info = getNativeInfo();
    if (!info) {
        return false;
    }
    return info.plugins.indexOf(name) >= 0;
}
function convertFileUri(uri) {
    // Napacitor 0.1:WebView 与原生同源,直接返回原 URI。
    return uri;
}
/**
 * 注册插件(原生形态)。返回 Proxy:未知属性按需生成
 * “调用 NAP_invoke(pluginId, 方法名, 首参)” 的函数。
 */
function registerPlugin(name) {
    const plugin = {
        addListener: (eventName, listener) => addListener(name, eventName, listener),
        removeListener: (eventName, listener) => {
            void listener; // 0.1 阶段按事件名粒度移除
            const stale = [];
            listeners.forEach((entry) => {
                if (entry.pluginId === name && entry.eventName === eventName) {
                    stale.push(entry.callbackId);
                }
            });
            return (async () => {
                for (const callbackId of stale) {
                    await removeListenerById(callbackId);
                }
            })();
        },
        removeAllListeners: () => removeAllListeners(name),
    };
    const callFactory = (method) => (...args) => {
        let options = args.length > 0 ? args[0] : null;
        if (typeof options !== 'object' || options === null) {
            options = {};
        }
        return invoke(name, method, options);
    };
    if (typeof Proxy === 'function') {
        return new Proxy(plugin, {
            get(target, prop) {
                if (typeof prop !== 'string') {
                    return undefined;
                }
                if (prop in target) {
                    return target[prop];
                }
                return callFactory(prop);
            },
        });
    }
    return plugin;
}
exports.registerPlugin = registerPlugin;
const NapacitorGlobalObject = {
    isNativePlatform,
    getPlatform,
    isPluginAvailable,
    convertFileUri,
    registerPlugin,
    version: '0.1.0',
};
bindNativeBridge();
// 安装全局对象(window 与 globalThis 双写,覆盖各平台 WebView 差异)
window.Napacitor = NapacitorGlobalObject;
globalThis['Napacitor'] = NapacitorGlobalObject;

})();
