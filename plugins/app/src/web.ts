/**
 * @napacitor/app 浏览器实现(基于 document.visibilitychange 映射生命周期)。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type { AppLanguage, AppState, AppUrl } from './definitions';

type AnyCallback = (...args: any[]) => void;

export class AppWeb {
  private _listeners: Record<string, AnyCallback[]> = {};
  private _visibilityHandler: (() => void) | null = null;

  async exitApp(): Promise<void> {
    throw new Error('App.exitApp:浏览器不支持退出应用');
  }

  async getState(): Promise<AppState> {
    return { isActive: !document.hidden };
  }

  async getLaunchUrl(): Promise<AppUrl> {
    return { url: window.location.href };
  }

  async getAppLanguage(): Promise<AppLanguage> {
    return { value: navigator.language || 'en' };
  }

  async addListener(
    eventName: string,
    callback: AnyCallback,
  ): Promise<PluginListenerHandle> {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }
    this._listeners[eventName].push(callback);
    this._ensureVisibility();
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
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }

  private _emit(event: string, data?: unknown): void {
    (this._listeners[event] ?? []).forEach((cb) => cb(data));
  }

  private _ensureVisibility(): void {
    if (this._visibilityHandler) return;
    this._visibilityHandler = () => {
      const active = !document.hidden;
      this._emit('appStateChange', { isActive: active });
      this._emit(active ? 'resume' : 'pause');
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);
  }
}
