/**
 * @napacitor/browser 类型定义。
 * 封装 .NET MAUI Browser API:系统内嵌浏览器(Android Custom Tabs /
 * iOS SFSafariViewController / 桌面回退到外部浏览器)。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** open() 参数。 */
export interface OpenOptions {
  /** 要打开的绝对地址。 */
  url: string;
  /** web 专用:window.open 的 target(默认 _blank);其他平台忽略。 */
  windowName?: string;
  /** 工具栏颜色(#RRGGBB / #AARRGGBB;平台不支持时忽略)。 */
  toolbarColor?: string;
  /** iOS 专用:呈现风格;其他平台忽略。 */
  presentationStyle?: 'fullscreen' | 'popover';
  /** iOS 专用(iPad popover 宽度);其他平台忽略。 */
  width?: number;
  /** iOS 专用(iPad popover 高度);其他平台忽略。 */
  height?: number;
}

export interface BrowserPlugin {
  /** 打开内嵌浏览器页面。 */
  open(options: OpenOptions): Promise<void>;
  /**
   * 关闭浏览器窗口。
   * MAUI Browser API 未提供跨平台关闭入口,原生端抛出 NOT_IMPLEMENTED
   * (Android Custom Tabs / iOS SFSafariViewController 需少量平台代码)。
   */
  close(): Promise<void>;
  /**
   * 浏览器被用户关闭时派发(Android/iOS;需平台代码,当前原生端不派发)。
   */
  addListener(
    eventName: 'browserFinished',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /**
   * 首个页面加载完成时派发(Android/iOS;需平台代码,当前原生端不派发)。
   */
  addListener(
    eventName: 'browserPageLoaded',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
