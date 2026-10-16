/**
 * @napacitor/device 浏览器实现(与 @capacitor/device 的 web 实现对应)。
 */
import type { DeviceInfo, GetLanguageCodeResult, GetLocaleResult } from './definitions';
export declare class DeviceWeb {
    getInfo(): Promise<DeviceInfo>;
    getLanguageCode(): Promise<GetLanguageCodeResult>;
    getLocale(): Promise<GetLocaleResult>;
}
