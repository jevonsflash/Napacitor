/**
 * @napacitor/flashlight 浏览器实现。
 * 浏览器无手电筒 API,所有操作抛出 NOT_SUPPORTED。
 */
import type {
  FlashlightOptions,
  FlashlightStateResult,
  FlashlightSupportedResult,
} from './definitions';

export class FlashlightWeb {
  async isSupported(): Promise<FlashlightSupportedResult> {
    return { supported: false };
  }

  async switchOn(_options?: FlashlightOptions): Promise<void> {
    throw new Error('Flashlight.switchOn:浏览器不支持手电筒');
  }

  async switchOff(): Promise<void> {
    throw new Error('Flashlight.switchOff:浏览器不支持手电筒');
  }

  async toggle(_options?: FlashlightOptions): Promise<void> {
    throw new Error('Flashlight.toggle:浏览器不支持手电筒');
  }

  async getState(): Promise<FlashlightStateResult> {
    return { isOn: false };
  }
}
