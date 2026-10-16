/**
 * @napacitor/battery 类型定义(与 @capacitor/battery 对应)。
 */
import type { PluginListenerHandle } from '@napacitor/core';
/** 电池状态。 */
export interface BatteryInfo {
    /** 电量(0.0 - 1.0)。 */
    batteryLevel: number;
    /** 是否正在充电。 */
    isCharging: boolean;
}
/** batteryStatusChange 事件回调。 */
export type BatteryChangeCallback = (info: BatteryInfo) => void;
export interface BatteryPlugin {
    /** 获取当前电池信息。 */
    getBatteryInfo(): Promise<BatteryInfo>;
    /** 监听电池状态变化(电量 / 充电状态)。 */
    addListener(eventName: 'batteryStatusChange', callback: BatteryChangeCallback): Promise<PluginListenerHandle> & PluginListenerHandle;
    /** 移除该插件全部监听器。 */
    removeAllListeners(): Promise<void>;
}
