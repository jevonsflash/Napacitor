/**
 * web/dev 模式运行时(与 Capacitor core 的 web runtime 对应)。
 *
 * 在普通浏览器(window.NapacitorNative 不存在)中提供与原生桥同形的
 * Napacitor 全局对象与 registerPlugin:invoke 分发到注册的 web 实现。
 */
import type { PluginImplementations } from './definitions';
/** 带 code 的异常。 */
export declare class NapacitorException extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * 注册插件:
 *  - 原生环境:复用注入的原生桥(window.Napacitor.registerPlugin)
 *  - 浏览器:惰性加载 impls.web 并分发调用
 *
 * 泛型约束与 Capacitor 的 PluginImplementation([prop: string]: any)一致:
 * any 值的索引签名才能接纳 interface 形态的插件 API 定义。
 */
export declare function registerPlugin<T extends Record<string, any>>(name: string, impls?: PluginImplementations): T;
/** 安装 web 运行时的全局 Napacitor 对象(原生环境已被注入,不覆盖)。 */
export declare function installWebRuntime(): void;
