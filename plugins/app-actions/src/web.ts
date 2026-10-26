/**
 * @napacitor/app-actions 浏览器实现(无对应 Web API,全部抛 NOT_IMPLEMENTED)。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type {
  GetActionsResult,
  IsSupportedResult,
  SetOptions,
} from './definitions';

type AnyCallback = (...args: any[]) => void;

export class AppActionsWeb {
  async set(_options: SetOptions): Promise<void> {
    throw new Error('AppActions.set:浏览器不支持应用快捷方式');
  }

  async get(): Promise<GetActionsResult> {
    throw new Error('AppActions.get:浏览器不支持应用快捷方式');
  }

  async isSupported(): Promise<IsSupportedResult> {
    return { supported: false };
  }

  async addListener(
    _eventName: string,
    _callback: AnyCallback,
  ): Promise<PluginListenerHandle> {
    throw new Error('AppActions.addListener:浏览器不支持应用快捷方式');
  }

  async removeAllListeners(): Promise<void> {
    // 无监听器可移除
  }
}
