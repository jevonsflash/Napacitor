/**
 * Napacitor 公共类型定义(与 Capacitor 的 definitions.ts 对应)。
 */
/** 运行 Napacitor 的平台。 */
export type Platform = 'web' | 'android' | 'ios' | 'mac' | 'windows';
/** 插件方法实现的集合,按运行形态分发(原生优先,语义与 Capacitor 一致)。 */
export interface PluginImplementations {
    /** .NET MAUI 原生实现描述(仅用于文档/类型提示,实际分发由原生桥完成)。 */
    maui?: unknown;
    /** 浏览器实现,惰性加载(约束与 Capacitor 的 PluginImplementation 一致)。 */
    web?: () => Promise<Record<string, any>> | Record<string, any>;
}
/** addListener 返回的监听器句柄。 */
export interface PluginListenerHandle {
    /** 移除该监听器。 */
    remove(): Promise<void>;
}
/** registerPlugin 返回的插件实例上自动附加的监听器方法。 */
export interface PluginListener {
    /**
     * 监听原生插件事件。
     * @param eventName 事件名
     * @param listener 回调
     */
    addListener(eventName: string, listener: (data: unknown) => void): Promise<PluginListenerHandle>;
    /** 移除指定事件的所有监听器。 */
    removeListener(eventName: string, listener: (data: unknown) => void): Promise<void>;
    /** 移除该插件全部监听器。 */
    removeAllListeners(): Promise<void>;
}
/** 带错误码的异常(与 Capacitor 的 Exception 对应)。 */
export interface NapacitorExceptionInterface {
    /** 机器可读错误码,如 'PLUGIN_NOT_FOUND'、'NOT_IMPLEMENTED'。 */
    code: string;
    message: string;
}
/** Napacitor 全局对象(与 Capacitor 全局对象对应)。 */
export interface NapacitorGlobal {
    /** 是否在原生(Napacitor MAUI 宿主)环境中运行。 */
    isNativePlatform(): boolean;
    /** 获取当前平台标识。 */
    getPlatform(): Platform;
    /** 插件在当前平台是否可用。 */
    isPluginAvailable(name: string): boolean;
    /**
     * 把设备文件 URI 转换为可被 WebView 直接加载的地址。
     * Napacitor 0.1 阶段原样返回传入值。
     */
    convertFileUri(uri: string): string;
    /** 当前运行时版本。 */
    readonly version: string;
    /** 注册插件(原生优先,web 回退;约束与 Capacitor 的 PluginImplementation 一致)。 */
    registerPlugin<T extends Record<string, any>>(name: string, impls?: PluginImplementations): T & PluginListener;
}
/** 原生端(C# NapacitorRuntime)注入到 window.NapacitorNative 的对象。 */
export interface NapacitorNativeGlobal {
    platform: Platform;
    version: string;
    plugins: string[];
    /** C# → JS 事件分发回调(callbackId, dataJson)。 */
    __emit(callbackId: string, dataJson: string): void;
    /** 文本读取助手(fetch 同源静态资源,供 C# 侧读取配置)。 */
    __fetchText(url: string): Promise<string | null>;
    /** JS 核心(native-bridge)加载前由初始化桩排队的事件。 */
    __pending: Array<{
        callbackId: string;
        dataJson: string;
    }>;
}
