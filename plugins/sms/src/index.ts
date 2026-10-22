/**
 * @napacitor/sms 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { SmsPlugin } from './definitions';

const Sms = registerPlugin<SmsPlugin>('Sms', {
  web: () => import('./web').then((m) => new m.SmsWeb()),
});

export * from './definitions';
export { Sms };
