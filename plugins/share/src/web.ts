/**
 * @napacitor/share 浏览器实现(与 @capacitor/share 的 web 实现对应)。
 * 基于 Web Share API(navigator.share);不可用的浏览器抛出错误。
 */
import type { CanShareResult, ShareOptions } from './definitions';

export class ShareWeb {
  async share(options: ShareOptions): Promise<void> {
    if (typeof navigator.share !== 'function') {
      throw new Error('Share.share:此浏览器不支持 Web Share API(navigator.share)');
    }
    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url,
    });
  }

  async canShare(): Promise<CanShareResult> {
    return { canShare: typeof navigator.share === 'function' };
  }
}
