/**
 * @napacitor/app 类型定义。
 * 应用生命周期 / 退出 / 语言 / 启动链接
 * (映射 MAUI Window 生命周期事件 + Application.Quit + CultureInfo)。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** 应用状态。 */
export interface AppState {
  /** 应用是否处于活跃状态(前台且可交互)。 */
  isActive: boolean;
}

/** getAppLanguage() 返回值。 */
export interface AppLanguage {
  /** 应用语言(BCP-47 风格,如 'zh-CN';无法识别时退回 ISO 双字母)。 */
  value: string;
}

/** getLaunchUrl() / appUrlOpen 事件载荷。 */
export interface AppUrl {
  /** 深度链接地址;未收到过时为空字符串。 */
  url: string;
}

/** backButton 事件载荷。 */
export interface BackButtonResponse {
  /** WebView 历史是否可回退(宿主未提供时为 false)。 */
  canGoBack: boolean;
}

export interface AppPlugin {
  /** 退出应用(Windows/macOS 有效;Android/iOS 系统不鼓励程序化退出,见 README)。 */
  exitApp(): Promise<void>;
  /** 获取应用当前状态。 */
  getState(): Promise<AppState>;
  /** 获取触发应用启动的深度链接(需宿主注册 URL scheme 并转发,见 README)。 */
  getLaunchUrl(): Promise<AppUrl>;
  /** 获取应用语言。 */
  getAppLanguage(): Promise<AppLanguage>;
  /** 应用前后台切换时派发(payload 为 {isActive})。 */
  addListener(
    eventName: 'appStateChange',
    listenerFunc: (state: AppState) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 应用进入后台时派发。 */
  addListener(
    eventName: 'pause',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 应用回到前台时派发。 */
  addListener(
    eventName: 'resume',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 应用经深度链接打开/唤起时派发(需宿主转发,见 README)。 */
  addListener(
    eventName: 'appUrlOpen',
    listenerFunc: (data: AppUrl) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** Android 硬件返回键按下时派发(需宿主转发,见 README)。 */
  addListener(
    eventName: 'backButton',
    listenerFunc: (data: BackButtonResponse) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
