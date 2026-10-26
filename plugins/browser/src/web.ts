/**
 * @napacitor/browser 浏览器实现(基于 window.open,
 * 与 @capacitor/browser 的 web 实现对应)。
 * browserFinished / browserPageLoaded 事件在浏览器中不可用。
 */
import type { OpenOptions } from './definitions';

type AnyCallback = (...args: any[]) => void;

export class BrowserWeb {
  private _lastWindow: Window | null = null;

  async open(options: OpenOptions): Promise<void> {
    if (!options.url) {
      throw new Error('Browser.open:url 不能为空');
    }
    this._lastWindow = window.open(options.url, options.windowName || '_blank');
  }

  async close(): Promise<void> {
    // 仅能关闭由脚本打开的窗口
    this._lastWindow?.close();
    this._lastWindow = null;
  }

  async addListener(_eventName: string, _callback: AnyCallback): Promise<void> {
    // 浏览器无法感知内嵌浏览器的关闭/加载完成事件
    throw new Error('Browser.addListener:web 平台不支持浏览器事件');
  }

  async removeAllListeners(): Promise<void> {
    // no-op
  }
}
