/**
 * @napacitor/device 浏览器实现(与 @capacitor/device 的 web 实现对应)。
 */
import type { DeviceInfo, GetLanguageCodeResult, GetLocaleResult } from './definitions';

export class DeviceWeb {
  async getInfo(): Promise<DeviceInfo> {
    return {
      model: navigator.userAgent,
      platform: 'web',
      osVersion: '',
      manufacturer: navigator.vendor ?? '',
      isVirtual: false,
    };
  }

  async getLanguageCode(): Promise<GetLanguageCodeResult> {
    return {
      value: navigator.language.split('-')[0] ?? 'en',
    };
  }

  async getLocale(): Promise<GetLocaleResult> {
    return {
      value: navigator.language,
    };
  }
}
