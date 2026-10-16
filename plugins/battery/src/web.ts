/**
 * @napacitor/battery 浏览器实现(与 @capacitor/battery 的 web 实现对应)。
 * 基于 Battery Status API(navigator.getBattery);不可用的浏览器抛出错误。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type { BatteryChangeCallback, BatteryInfo } from './definitions';

/** navigator.getBattery 的最小结构(Battery Status API)。 */
interface BatteryManagerLike {
  readonly level: number;
  readonly charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export class BatteryWeb {
  async getBatteryInfo(): Promise<BatteryInfo> {
    const battery = await this.getBattery();
    return { batteryLevel: battery.level, isCharging: battery.charging };
  }

  async addListener(
    eventName: 'batteryStatusChange',
    callback: BatteryChangeCallback,
  ): Promise<PluginListenerHandle> {
    void eventName;
    const battery = await this.getBattery();
    const handler = () =>
      callback({ batteryLevel: battery.level, isCharging: battery.charging });
    battery.addEventListener('levelchange', handler);
    battery.addEventListener('chargingchange', handler);
    return {
      remove: async () => {
        battery.removeEventListener('levelchange', handler);
        battery.removeEventListener('chargingchange', handler);
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    // 监听器由各自句柄的 remove() 移除;此处无全局需要清理的状态
  }

  private getBattery(): Promise<BatteryManagerLike> {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };
    if (typeof nav.getBattery !== 'function') {
      return Promise.reject(
        new Error('Battery.getBatteryInfo:此浏览器不支持 Battery Status API'),
      );
    }
    return nav.getBattery();
  }
}
