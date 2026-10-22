/**
 * @napacitor/motion 浏览器实现。
 * 基于 DeviceMotionEvent(加速度计 / 陀螺仪)与 DeviceOrientationEvent(指南针)。
 * 磁力计与气压计在浏览器中无标准 API,isSupported 返回 false。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type {
  AccelerometerCallback,
  AxisReading,
  BarometerCallback,
  BarometerReading,
  CompassCallback,
  CompassReading,
  GyroscopeCallback,
  MagnetometerCallback,
  StartSensorOptions,
} from './definitions';

type AnyCallback = (...args: any[]) => void;

/** 事件名 → 回调列表。 */
type ListenerMap = Record<string, AnyCallback[]>;

export class MotionWeb {
  private _listeners: ListenerMap = {};
  private _motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private _orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;
  private _activeSensors = new Set<string>();

  /* ── 支持检测 ───────────────────────────────────────────── */

  async isAccelerometerSupported(): Promise<{ supported: boolean }> {
    return { supported: 'DeviceMotionEvent' in window };
  }
  async isGyroscopeSupported(): Promise<{ supported: boolean }> {
    return { supported: 'DeviceMotionEvent' in window };
  }
  async isMagnetometerSupported(): Promise<{ supported: boolean }> {
    return { supported: false };
  }
  async isCompassSupported(): Promise<{ supported: boolean }> {
    return { supported: 'DeviceOrientationEvent' in window };
  }
  async isBarometerSupported(): Promise<{ supported: boolean }> {
    return { supported: false };
  }

  /* ── 启动 / 停止 ───────────────────────────────────────── */

  async startAccelerometer(_options?: StartSensorOptions): Promise<void> {
    this._ensureMotion();
    this._activeSensors.add('accelerometer');
  }

  async stopAccelerometer(): Promise<void> {
    this._activeSensors.delete('accelerometer');
    this._teardownMotion();
  }

  async startGyroscope(_options?: StartSensorOptions): Promise<void> {
    this._ensureMotion();
    this._activeSensors.add('gyroscope');
  }

  async stopGyroscope(): Promise<void> {
    this._activeSensors.delete('gyroscope');
    this._teardownMotion();
  }

  async startMagnetometer(_options?: StartSensorOptions): Promise<void> {
    throw new Error('Motion.startMagnetometer:浏览器不支持磁力计');
  }

  async stopMagnetometer(): Promise<void> {
    // no-op
  }

  async startCompass(_options?: StartSensorOptions): Promise<void> {
    if (!('DeviceOrientationEvent' in window)) {
      throw new Error('Motion.startCompass:浏览器不支持 DeviceOrientationEvent');
    }
    this._teardownOrientation();
    this._orientationHandler = (e: DeviceOrientationEvent) => {
      const alpha = e.alpha ?? 0; // 0-360,相对正北(webkitCompassHeading)
      const heading = (e as any).webkitCompassHeading ?? (360 - alpha);
      const reading: CompassReading = {
        headingMagnetic: heading,
        headingTrue: heading,
        calibration: 'UNRELIABLE' as any,
      };
      this._emit('compassReading', reading);
    };
    window.addEventListener('deviceorientation', this._orientationHandler);
    this._activeSensors.add('compass');
  }

  async stopCompass(): Promise<void> {
    this._activeSensors.delete('compass');
    this._teardownOrientation();
  }

  async startBarometer(_options?: StartSensorOptions): Promise<void> {
    throw new Error('Motion.startBarometer:浏览器不支持气压计');
  }

  async stopBarometer(): Promise<void> {
    // no-op
  }

  /* ── 事件监听 ───────────────────────────────────────────── */

  async addListener(
    eventName: string,
    callback: AnyCallback,
  ): Promise<PluginListenerHandle> {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(callback);
    return {
      remove: async () => {
        const arr = this._listeners[eventName];
        if (arr) {
          const idx = arr.indexOf(callback);
          if (idx >= 0) arr.splice(idx, 1);
        }
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    this._listeners = {};
    this.stopAccelerometer();
    this.stopGyroscope();
    this.stopCompass();
  }

  /* ── 内部 ───────────────────────────────────────────────── */

  private _emit(event: string, data: any): void {
    (this._listeners[event] ?? []).forEach((cb) => cb(data));
  }

  private _ensureMotion(): void {
    if (this._motionHandler) return;
    if (!('DeviceMotionEvent' in window)) {
      throw new Error('Motion:浏览器不支持 DeviceMotionEvent');
    }
    this._motionHandler = (e: DeviceMotionEvent) => {
      if (this._activeSensors.has('accelerometer')) {
        const a = e.accelerationIncludingGravity;
        if (a) {
          const reading: AxisReading = {
            x: (a.x ?? 0) / 9.81,
            y: (a.y ?? 0) / 9.81,
            z: (a.z ?? 0) / 9.81,
          };
          this._emit('accelerometerReading', reading);
        }
      }
      if (this._activeSensors.has('gyroscope')) {
        const r = e.rotationRate;
        if (r) {
          const reading: AxisReading = {
            x: r.alpha ?? 0,
            y: r.beta ?? 0,
            z: r.gamma ?? 0,
          };
          this._emit('gyroscopeReading', reading);
        }
      }
    };
    window.addEventListener('devicemotion', this._motionHandler);
  }

  private _teardownMotion(): void {
    if (this._motionHandler && this._activeSensors.size === 0) {
      window.removeEventListener('devicemotion', this._motionHandler);
      this._motionHandler = null;
    }
  }

  private _teardownOrientation(): void {
    if (this._orientationHandler) {
      window.removeEventListener('deviceorientation', this._orientationHandler);
      this._orientationHandler = null;
    }
  }
}
