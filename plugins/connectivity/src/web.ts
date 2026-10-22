/**
 * @napacitor/connectivity 浏览器实现。
 * 基于 navigator.onLine 与 Network Information API。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type {
  ConnectivityChangeCallback,
  NetworkStatus,
} from './definitions';
import { ConnectionType, NetworkAccess } from './definitions';

export class ConnectivityWeb {
  private _onlineHandler: (() => void) | null = null;
  private _offlineHandler: (() => void) | null = null;
  private _listeners: ConnectivityChangeCallback[] = [];

  async getStatus(): Promise<NetworkStatus> {
    const online = navigator.onLine;
    const connectionType: ConnectionType = online ? ConnectionType.WiFi : ConnectionType.None;
    const networkAccess: NetworkAccess = online ? NetworkAccess.Internet : NetworkAccess.None;
    return { connectionType, networkAccess, isConnected: online };
  }

  async hasInternetAccess(): Promise<boolean> {
    return navigator.onLine;
  }

  async addListener(
    eventName: 'connectivityChange',
    callback: ConnectivityChangeCallback,
  ): Promise<PluginListenerHandle> {
    void eventName;
    this._listeners.push(callback);
    if (!this._onlineHandler) {
      this._onlineHandler = () => this._notify();
      this._offlineHandler = () => this._notify();
      window.addEventListener('online', this._onlineHandler);
      window.addEventListener('offline', this._offlineHandler);
    }
    return {
      remove: async () => {
        this._listeners = this._listeners.filter((cb) => cb !== callback);
        if (this._listeners.length === 0) {
          this._teardown();
        }
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    this._listeners = [];
    this._teardown();
  }

  private _teardown(): void {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      window.removeEventListener('offline', this._offlineHandler!);
      this._onlineHandler = null;
      this._offlineHandler = null;
    }
  }

  private async _notify(): Promise<void> {
    const status = await this.getStatus();
    this._listeners.forEach((cb) => cb(status));
  }
}
