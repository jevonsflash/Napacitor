/**
 * @napacitor/share 浏览器实现(与 @capacitor/share 的 web 实现对应)。
 * 基于 Web Share API(navigator.share);不可用的浏览器抛出错误。
 */
import type { CanShareResult, ShareOptions } from './definitions';
export declare class ShareWeb {
    share(options: ShareOptions): Promise<void>;
    canShare(): Promise<CanShareResult>;
}
