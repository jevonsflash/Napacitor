/**
 * @napacitor/phone-dialer 浏览器实现。
 * 基于 tel: 协议。
 */
import type { DialOptions, PhoneDialerSupportedResult } from './definitions';

export class PhoneDialerWeb {
  async isSupported(): Promise<PhoneDialerSupportedResult> {
    return { supported: true };
  }

  async open(options: DialOptions): Promise<void> {
    if (!options.number) {
      throw new Error('PhoneDialer.open:需要提供电话号码');
    }
    window.location.href = `tel:${options.number}`;
  }
}
