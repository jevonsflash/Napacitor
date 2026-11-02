/**
 * @napacitor/display 浏览器实现:
 * - getInfo:window.screen + devicePixelRatio(刷新率浏览器不可知,恒为 0)
 * - setKeepAwake:Wake Lock API(navigator.wakeLock)
 * - lock/unlock:Screen Orientation API(通常要求全屏或安装为 PWA)
 * - displayChange:resize / orientationchange 事件
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type {
  DisplayChangeCallback,
  DisplayInfo,
  DisplayOrientation,
  KeepAwakeOptions,
  LockOptions,
} from './definitions';

/** navigator.wakeLock 的最小结构(Wake Lock API)。 */
interface WakeLockLike {
  request(type: 'screen'): Promise<{ release(): Promise<void> }>;
}

/** screen.orientation 的最小结构(Screen Orientation API)。 */
interface ScreenOrientationLike {
  lock(orientation: string): Promise<void>;
  unlock(): void;
  readonly angle: number;
}

export class DisplayWeb {
  private _wakeLock: { release(): Promise<void> } | null = null;

  async getInfo(): Promise<DisplayInfo> {
    const orientation = this._screenOrientation();
    return {
      width: window.screen.width,
      height: window.screen.height,
      density: window.devicePixelRatio || 1,
      orientation: this._currentOrientation(),
      rotation: orientation?.angle ?? 0,
      refreshRate: 0,
    };
  }

  async setKeepAwake(options: KeepAwakeOptions): Promise<void> {
    if (options.keepAwake) {
      const wakeLock = this._wakeLockApi();
      if (!wakeLock) {
        throw new Error('Display.setKeepAwake:此浏览器不支持 Wake Lock API');
      }
      try {
        this._wakeLock = await wakeLock.request('screen');
      } catch (e) {
        throw new Error(
          `Display.setKeepAwake:请求屏幕唤醒锁失败:${(e as Error).message}`,
        );
      }
    } else {
      await this._wakeLock?.release();
      this._wakeLock = null;
    }
  }

  async lock(options: LockOptions): Promise<void> {
    const orientation = this._screenOrientation();
    if (!orientation || typeof orientation.lock !== 'function') {
      throw new Error('Display.lock:此浏览器不支持 Screen Orientation API');
    }
    try {
      await orientation.lock(options.orientation);
    } catch (e) {
      throw new Error(
        `Display.lock:锁定方向失败(通常需要全屏或安装为 PWA):${(e as Error).message}`,
      );
    }
  }

  async unlock(): Promise<void> {
    const orientation = this._screenOrientation();
    if (!orientation || typeof orientation.unlock !== 'function') {
      throw new Error('Display.unlock:此浏览器不支持 Screen Orientation API');
    }
    orientation.unlock();
  }

  async addListener(
    eventName: 'displayChange',
    callback: DisplayChangeCallback,
  ): Promise<PluginListenerHandle> {
    void eventName;
    const handler = () => callback(this._snapshot());
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return {
      remove: async () => {
        window.removeEventListener('resize', handler);
        window.removeEventListener('orientationchange', handler);
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    // 监听器由各自句柄的 remove() 移除;此处无全局需要清理的状态
  }

  private _currentOrientation(): DisplayOrientation {
    return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
  }

  private _snapshot(): DisplayInfo {
    return {
      width: window.screen.width,
      height: window.screen.height,
      density: window.devicePixelRatio || 1,
      orientation: this._currentOrientation(),
      rotation: this._screenOrientation()?.angle ?? 0,
      refreshRate: 0,
    };
  }

  private _wakeLockApi(): WakeLockLike | undefined {
    return (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock;
  }

  private _screenOrientation(): ScreenOrientationLike | undefined {
    return (screen as Screen & { orientation?: ScreenOrientationLike })
      .orientation;
  }
}
