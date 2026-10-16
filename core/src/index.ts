/**
 * @napacitor/core 入口(与 Capacitor core 的 index.ts 策略一致):
 *  - 原生环境:window.Napacitor 已由注入的 native-bridge 安装,直接复用
 *  - 浏览器:安装 web 运行时,registerPlugin 分发到各插件的 web 实现
 */
import { installWebRuntime } from './runtime';

export { registerPlugin } from './runtime';
export { NapacitorException } from './runtime';

export * from './definitions';

// 装配全局对象:原生环境为 no-op(已注入),浏览器安装 web 运行时
installWebRuntime();

/** Napacitor 全局对象的类型化引用。 */
export const Napacitor: {
  isNativePlatform(): boolean;
  getPlatform(): string;
  isPluginAvailable(name: string): boolean;
  convertFileUri(uri: string): string;
  registerPlugin<T extends Record<string, any>>(
    name: string,
    impls?: { web?: unknown },
  ): T;
  readonly version: string;
} = (globalThis as Record<string, unknown>)['Napacitor'] as never;
