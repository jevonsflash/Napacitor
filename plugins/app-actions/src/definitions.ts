/**
 * @napacitor/app-actions 类型定义。
 * 封装 .NET MAUI AppActions API:应用图标快捷方式
 * (Android App Shortcuts / iOS 主屏 Quick Actions / Windows 任务栏跳转列表)。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** 应用操作(快捷方式)定义。 */
export interface AppActionInfo {
  /** 唯一标识(用于响应点击时区分操作)。 */
  id: string;
  /** 显示标题。 */
  title: string;
  /** 副标题(平台支持时显示在标题下方)。 */
  subtitle?: string;
  /** 图标(需与各平台资源目录中的图标匹配;平台不支持时忽略)。 */
  icon?: string;
}

/** set() 参数。 */
export interface SetOptions {
  /** 要设置的快捷方式列表(整体替换当前列表)。 */
  actions: AppActionInfo[];
}

/** get() / isSupported() 返回值。 */
export interface GetActionsResult {
  /** 当前已设置的快捷方式列表。 */
  actions: AppActionInfo[];
}

/** isSupported() 返回值。 */
export interface IsSupportedResult {
  /** 当前平台是否支持应用快捷方式。 */
  supported: boolean;
}

/** appActionPerformed 事件载荷。 */
export interface AppActionPerformed {
  /** 被触发的快捷方式。 */
  action: AppActionInfo;
}

export interface AppActionsPlugin {
  /** 设置应用快捷方式(整体替换;平台不支持时抛 FeatureNotSupported 错误)。 */
  set(options: SetOptions): Promise<void>;
  /** 获取当前已设置的应用快捷方式。 */
  get(): Promise<GetActionsResult>;
  /** 检查当前平台是否支持应用快捷方式。 */
  isSupported(): Promise<IsSupportedResult>;
  /** 用户从应用图标触发快捷方式时派发(需宿主在 ConfigureEssentials 中转发,见 README)。 */
  addListener(
    eventName: 'appActionPerformed',
    listenerFunc: (event: AppActionPerformed) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
