"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NapacitorException = void 0;
exports.registerPlugin = registerPlugin;
exports.installWebRuntime = installWebRuntime;
/** 带 code 的异常。 */
class NapacitorException extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'NapacitorException';
        this.code = code;
    }
}
exports.NapacitorException = NapacitorException;
const registrations = new Map();
function getNativeInfo() {
    return window.NapacitorNative;
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
    if (info) {
        return info.plugins.indexOf(name) >= 0;
    }
    return registrations.has(name);
}
function convertFileUri(uri) {
    return uri;
}
/** 加载并缓存插件的 web 实现。 */
function resolveWebImpl(registration) {
    if (!registration.resolved) {
        const loader = registration.impls.web;
        if (!loader) {
            registration.resolved = Promise.reject(new NapacitorException('NOT_IMPLEMENTED', `插件 ${registration.name} 未提供 web 实现`));
        }
        else if (typeof loader === 'function') {
            registration.resolved = Promise.resolve(loader()).then((mod) => {
                if (mod && typeof mod === 'object') {
                    return mod;
                }
                return {};
            });
        }
        else {
            registration.resolved = Promise.resolve(loader);
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
function registerPlugin(name, impls = {}) {
    if (isNativePlatform()) {
        const nativeNapacitor = window.Napacitor;
        return nativeNapacitor.registerPlugin(name);
    }
    registrations.set(name, { name, impls });
    const plugin = {
        addListener: (eventName, listener) => {
            void eventName;
            void listener;
            return Promise.reject(new NapacitorException('NOT_IMPLEMENTED', `插件 ${name} 在 web 环境不支持事件监听`));
        },
        removeListener: () => Promise.resolve(),
        removeAllListeners: () => Promise.resolve(),
    };
    const callFactory = (method) => (...args) => {
        const registration = registrations.get(name);
        if (!registration) {
            return Promise.reject(new NapacitorException('PLUGIN_NOT_FOUND', `插件 ${name} 未注册`));
        }
        return resolveWebImpl(registration).then((impl) => {
            const fn = impl[method];
            if (typeof fn !== 'function') {
                throw new NapacitorException('NOT_IMPLEMENTED', `插件 ${name} 的 web 实现缺少方法 ${method}`);
            }
            return fn.apply(impl, args);
        });
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
/** 安装 web 运行时的全局 Napacitor 对象(原生环境已被注入,不覆盖)。 */
function installWebRuntime() {
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
