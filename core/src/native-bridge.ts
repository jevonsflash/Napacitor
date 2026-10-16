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

interface NapacitorNativeInfo {
  platform: string;
  version: string;
  plugins: string[];
  __pending?: Array<{ callbackId: string; dataJson: string }>;
  __emit?: (callbackId: string, dataJson: string) => void;
  __fetchText?: (url: string) => Promise<string | null>;
}

interface NapacitorPluginEvent {
  callbackId: string;
  pluginId: string;
  eventName: string;
  listener: (data: unknown) => void;
}

interface NativeBridgeGlobal {
  Napacitor?: unknown;
  NapacitorNative?: NapacitorNativeInfo;
  DotNet?: {
    invokeMethodAsync: (
      assembly: string,
      method: string,
      ...args: unknown[]
    ) => Promise<string>;
  };
}

declare const window: NativeBridgeGlobal & Record<string, unknown>;
declare const globalThis: Record<string, unknown>;

/** Napacitor 运行时程序集名(C# 侧程序集即 Napacitor)。 */
const NAPACITOR_ASSEMBLY = 'Napacitor';

/** 调用结果信封(与 C# NapacitorBridge 的返回格式对应)。 */
interface ResultEnvelope {
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string };
}

/** 带 code 的异常(与 Capacitor 的 Exception 对应)。 */
export class NapacitorException extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'NapacitorException';
    this.code = code;
  }
}

/** callbackId → 监听器。 */
const listeners = new Map<string, NapacitorPluginEvent>();
let listenerSeq = 0;

function getNativeInfo(): NapacitorNativeInfo | undefined {
  return window.NapacitorNative;
}

function getDotNet(): NonNullable<NativeBridgeGlobal['DotNet']> | undefined {
  return window.DotNet;
}

function rejectNoBridge(): Promise<never> {
  return Promise.reject(
    new NapacitorException(
      'BRIDGE_NOT_AVAILABLE',
      'window.DotNet 不可用 —— Napacitor 原生桥必须在 .NET MAUI BlazorWebView 中运行',
    ),
  );
}

/** 调用 C# 插件方法,解包信封并抛出 NapacitorException。 */
export function invoke(
  pluginId: string,
  methodName: string,
  options?: Record<string, unknown> | null,
): Promise<unknown> {
  const dotnet = getDotNet();
  if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
    return rejectNoBridge();
  }
  return dotnet
    .invokeMethodAsync(
      NAPACITOR_ASSEMBLY,
      'NAP_invoke',
      pluginId,
      methodName,
      JSON.stringify(options ?? {}),
    )
    .then((raw: string) => {
      const envelope = JSON.parse(raw) as ResultEnvelope;
      if (envelope.ok) {
        return envelope.data;
      }
      const err = envelope.error ?? { code: 'ERROR', message: '未知错误' };
      throw new NapacitorException(err.code, err.message);
    });
}

/** 注册事件监听器,返回可 remove 的句柄。 */
export async function addListener(
  pluginId: string,
  eventName: string,
  listener: (data: unknown) => void,
): Promise<{ remove: () => Promise<void> }> {
  const dotnet = getDotNet();
  if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
    return rejectNoBridge();
  }
  const callbackId = `${pluginId}.${eventName}.${++listenerSeq}`;
  listeners.set(callbackId, { callbackId, pluginId, eventName, listener });
  await dotnet.invokeMethodAsync(
    NAPACITOR_ASSEMBLY,
    'NAP_addListener',
    pluginId,
    eventName,
    callbackId,
  );
  return {
    remove: async () => {
      await removeListenerById(callbackId);
    },
  };
}

async function removeListenerById(callbackId: string): Promise<void> {
  if (!listeners.delete(callbackId)) {
    return;
  }
  const dotnet = getDotNet();
  if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
    return;
  }
  await dotnet.invokeMethodAsync(
    NAPACITOR_ASSEMBLY,
    'NAP_removeListener',
    callbackId,
  );
}

async function removeAllListeners(pluginId: string): Promise<void> {
  const stale: string[] = [];
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
  await dotnet.invokeMethodAsync(
    NAPACITOR_ASSEMBLY,
    'NAP_removeAllListeners',
    pluginId,
  );
}

/**
 * C# → JS 事件分发入口。native-bridge 尚未加载时,由 C# 注入的初始化桩
 * 将事件排入 NapacitorNative.__pending,此处安装真实现并回放队列。
 */
function emit(callbackId: string, dataJson: string): void {
  const entry = listeners.get(callbackId);
  if (!entry) {
    return;
  }
  let data: unknown = null;
  try {
    data = dataJson ? JSON.parse(dataJson) : null;
  } catch {
    data = dataJson;
  }
  entry.listener(data);
}

function bindNativeBridge(): void {
  const info = getNativeInfo();
  if (!info) {
    return;
  }
  info.__emit = emit;
  info.__fetchText = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      return await res.text();
    } catch {
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
}

function isNativePlatform(): boolean {
  return getNativeInfo() !== undefined;
}

function getPlatform(): string {
  const info = getNativeInfo();
  return info ? info.platform : 'web';
}

function isPluginAvailable(name: string): boolean {
  const info = getNativeInfo();
  if (!info) {
    return false;
  }
  return info.plugins.indexOf(name) >= 0;
}

function convertFileUri(uri: string): string {
  // Napacitor 0.1:WebView 与原生同源,直接返回原 URI。
  return uri;
}

/**
 * 注册插件(原生形态)。返回 Proxy:未知属性按需生成
 * “调用 NAP_invoke(pluginId, 方法名, 首参)” 的函数。
 */
export function registerPlugin<T extends Record<string, any>>(
  name: string,
): T {
  const plugin: Record<string, unknown> = {
    addListener: (eventName: string, listener: (data: unknown) => void) =>
      addListener(name, eventName, listener),
    removeListener: (
      eventName: string,
      listener: (data: unknown) => void,
    ): Promise<void> => {
      void listener; // 0.1 阶段按事件名粒度移除
      const stale: string[] = [];
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

  const callFactory =
    (method: string) =>
    (...args: unknown[]) => {
      let options = args.length > 0 ? (args[0] as Record<string, unknown>) : null;
      if (typeof options !== 'object' || options === null) {
        options = {};
      }
      return invoke(name, method, options);
    };

  if (typeof Proxy === 'function') {
    return new Proxy(plugin, {
      get(target, prop: string | symbol) {
        if (typeof prop !== 'string') {
          return undefined;
        }
        if (prop in target) {
          return target[prop];
        }
        return callFactory(prop);
      },
    }) as unknown as T;
  }
  return plugin as unknown as T;
}

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
