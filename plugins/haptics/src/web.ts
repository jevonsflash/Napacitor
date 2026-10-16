/**
 * @napacitor/haptics 浏览器实现(与 @capacitor/haptics 的 web 实现对应)。
 * 基于 Vibration API(navigator.vibrate),不支持的浏览器为静默无操作。
 */
import {
  ImpactStyle,
  NotificationType,
} from './definitions';
import type {
  ImpactOptions,
  NotificationOptions,
  VibrateOptions,
} from './definitions';

/** impact 强度 → 振动时长(毫秒)。 */
const impactDurations: Record<string, number> = {
  LIGHT: 10,
  MEDIUM: 25,
  HEAVY: 40,
};

/** notification 类型 → 振动时长(毫秒)。 */
const notificationDurations: Record<string, number> = {
  SUCCESS: 35,
  WARNING: 45,
  ERROR: 60,
};

export class HapticsWeb {
  async impact(options?: ImpactOptions): Promise<void> {
    const style = options?.style ?? ImpactStyle.Medium;
    this.vibrateFor(impactDurations[style] ?? 25);
  }

  async notification(options?: NotificationOptions): Promise<void> {
    const type = options?.type ?? NotificationType.Success;
    this.vibrateFor(notificationDurations[type] ?? 35);
  }

  async vibrate(options?: VibrateOptions): Promise<void> {
    this.vibrateFor(options?.duration ?? 60);
  }

  async selection(): Promise<void> {
    this.vibrateFor(10);
  }

  async selectionChanged(): Promise<void> {
    this.vibrateFor(10);
  }

  private vibrateFor(duration: number): void {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(duration);
    }
  }
}
