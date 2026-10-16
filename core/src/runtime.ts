/**
 * web/dev 模式运行时(与 Capacitor core 的 web runtime 对应)。
 *
 * 在普通浏览器(window.NapacitorNative 不存在)中提供与原生桥同形的
 * Napacitor 全局对象与 registerPlugin:invoke 分发到注册的 web 实现。
 */
import type { PluginImplementations } from './definitions';

interface NapacitorNativeInfo {
  platform: string;
  version: string;
  plugins: string[];
}

interface RuntimeGlobal {
  Napacitor?: unknown;
  NapacitorNative?: NapacitorNativeInfo;
}

declare const window: RuntimeGlobal & Record<string, unknown>;

/** 带 code 的异常。 */
export class NapacitorException extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'NapacitorException';
    this.code = code;
  }
}

interface PluginRegistration {
  name: string;
  impls: PluginImplementations;
  /** 已解析的 web 实现(惰性加载后缓存)。 */
  resolved?: Promise<Record<string, unknown>>;
}

const registrations = new Map<string, PluginRegistration>();

function getNativeInfo(): NapacitorNativeInfo | undefined {
  return window.NapacitorNative;
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
  if (info) {
    return info.plugins.indexOf(name) >= 0;
  }
  return registrations.has(name);
}

function convertFileUri(uri: string): string {
  return uri;
}

/** 加载并缓存插件的 web 实现。 */
function resolveWebImpl(
  registration: PluginRegistration,
): Promise<Record<string, unknown>> {
  if (!registration.resolved) {
    const loader = registration.impls.web;
    if (!loader) {
      registration.resolved = Promise.reject(
        new NapacitorException(
          'NOT_IMPLEMENTED',
          `插件 ${registration.name} 未提供 web 实现`,
        ),
      );
    } else if (typeof loader === 'function') {
      registration.resolved = Promise.resolve(loader()).then((mod) => {
        if (mod && typeof mod === 'object') {
          return mod as Record<string, unknown>;
        }
        return {};
      });
    } else {
      registration.resolved = Promise.resolve(
        loader as Record<string, unknown>,
      );
    }
  }
  return registration.resolved;
}

/**
 * 注册插件:
 *  - 原生环境:复用注入的原生桥(window.Napacitor.registerPlugin)
 *  - 浏览器:惰性加载 impls.web 并分发调用
 *
 * 泛型约束与 Capacitor 的 PluginImplementation([prop: string]: any)一致:
 * any 值的索引签名才能接纳 interface 形态的插件 API 定义。
 */
export function registerPlugin<T extends Record<string, any>>(
  name: string,
  impls: PluginImplementations = {},
): T {
  if (isNativePlatform()) {
    const nativeNapacitor = window.Napacitor as {
      registerPlugin: (name: string) => T;
    };
    return nativeNapacitor.registerPlugin(name);
  }

  registrations.set(name, { name, impls });

  const plugin: Record<string, unknown> = {
    addListener: (
      eventName: string,
      listener: (data: unknown) => void,
    ): Promise<{ remove: () => Promise<void> }> => {
      void eventName;
      void listener;
      return Promise.reject(
        new NapacitorException(
          'NOT_IMPLEMENTED',
          `插件 ${name} 在 web 环境不支持事件监听`,
        ),
      );
    },
    removeListener: (): Promise<void> => Promise.resolve(),
    removeAllListeners: (): Promise<void> => Promise.resolve(),
  };

  const callFactory =
    (method: string) =>
    (...args: unknown[]): Promise<unknown> => {
      const registration = registrations.get(name);
      if (!registration) {
        return Promise.reject(
          new NapacitorException('PLUGIN_NOT_FOUND', `插件 ${name} 未注册`),
        );
      }
      return resolveWebImpl(registration).then((impl) => {
        const fn = impl[method];
        if (typeof fn !== 'function') {
          throw new NapacitorException(
            'NOT_IMPLEMENTED',
            `插件 ${name} 的 web 实现缺少方法 ${method}`,
          );
        }
        return (fn as (...a: unknown[]) => unknown).apply(impl, args);
      });
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

/** 安装 web 运行时的全局 Napacitor 对象(原生环境已被注入,不覆盖)。 */
export function installWebRuntime(): void {
  if (isNativePlatform()) {
    return;
  }
  const webRuntime = {
    isNativePlatform,
    getPlatform,
    isPluginAvailable,
    convertFileUri,
    registerPlugin,
    version: '0.1.0',
  };
  window.Napacitor = webRuntime;
}
