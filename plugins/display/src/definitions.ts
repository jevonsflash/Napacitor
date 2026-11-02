/**
 * @napacitor/display 类型定义。
 * 封装 .NET MAUI DeviceDisplay API:屏幕指标读取、变化监听、屏幕常亮,
 * 以及运行时屏幕方向锁定(对应 MAUI 各平台的屏幕方向机制)。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** 屏幕方向。 */
export type DisplayOrientation = 'portrait' | 'landscape';

/** 屏幕信息(映射 MAUI MainDisplayInfo)。 */
export interface DisplayInfo {
  /** 像素宽度。 */
  width: number;
  /** 像素高度。 */
  height: number;
  /** 屏幕密度(1x = 1.0,2x = 2.0)。 */
  density: number;
  /** 当前方向:portrait / landscape。 */
  orientation: DisplayOrientation;
  /** 相对自然方向的旋转角度(0 / 90 / 180 / 270)。 */
  rotation: number;
  /** 屏幕刷新率(Hz;平台未知时为 0)。 */
  refreshRate: number;
}

/** setKeepAwake() 参数。 */
export interface KeepAwakeOptions {
  /** 是否保持屏幕常亮(阻止设备锁屏/熄屏)。 */
  keepAwake: boolean;
}

/** lock() 参数。 */
export interface LockOptions {
  /** 要锁定的方向。 */
  orientation: DisplayOrientation;
}

/** displayChange 事件回调。 */
export type DisplayChangeCallback = (info: DisplayInfo) => void;

export interface DisplayPlugin {
  /** 获取当前屏幕信息。 */
  getInfo(): Promise<DisplayInfo>;
  /** 设置屏幕是否保持常亮(映射 KeepScreenOn)。 */
  setKeepAwake(options: KeepAwakeOptions): Promise<void>;
  /** 锁定屏幕方向(Android/iOS/Mac Catalyst;Windows 不支持)。 */
  lock(options: LockOptions): Promise<void>;
  /** 解锁方向,回落到全局设置。 */
  unlock(): Promise<void>;
  /** 监听屏幕指标变化(方向/尺寸/密度等)。 */
  addListener(
    eventName: 'displayChange',
    callback: DisplayChangeCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
