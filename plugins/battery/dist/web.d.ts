/**
 * @napacitor/battery 浏览器实现(与 @capacitor/battery 的 web 实现对应)。
 * 基于 Battery Status API(navigator.getBattery);不可用的浏览器抛出错误。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type { BatteryChangeCallback, BatteryInfo } from './definitions';
export declare class BatteryWeb {
    getBatteryInfo(): Promise<BatteryInfo>;
    addListener(eventName: 'batteryStatusChange', callback: BatteryChangeCallback): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
    private getBattery;
}
