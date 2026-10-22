/**
 * @napacitor/email 浏览器实现。
 * 基于 mailto: 协议。
 */
import type { ComposeOptions, EmailSupportedResult } from './definitions';

export class EmailWeb {
  async isSupported(): Promise<EmailSupportedResult> {
    return { supported: true };
  }

  async compose(options?: ComposeOptions): Promise<void> {
    const params = new URLSearchParams();
    if (options?.to?.length) params.set('to', options.to.join(','));
    if (options?.cc?.length) params.set('cc', options.cc.join(','));
    if (options?.bcc?.length) params.set('bcc', options.bcc.join(','));
    if (options?.subject) params.set('subject', options.subject);
    if (options?.body) params.set('body', options.body);
    const qs = params.toString();
    window.location.href = `mailto:${options?.to?.[0] ?? ''}${qs ? '?' + qs : ''}`;
  }
}
