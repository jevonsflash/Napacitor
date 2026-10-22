/**
 * @napacitor/sms 浏览器实现。
 * 基于 sms: 协议。
 */
import type { SmsOptions, SmsSupportedResult } from './definitions';

export class SmsWeb {
  async isSupported(): Promise<SmsSupportedResult> {
    return { supported: true };
  }

  async send(options: SmsOptions): Promise<void> {
    if (!options.recipients?.length) {
      throw new Error('Sms.send:需要提供收件人');
    }
    const to = options.recipients.join(',');
    const body = options.body ? `?body=${encodeURIComponent(options.body)}` : '';
    window.location.href = `sms:${to}${body}`;
  }
}
