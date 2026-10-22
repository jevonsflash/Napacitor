/**
 * @napacitor/phone-dialer 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { PhoneDialerPlugin } from './definitions';

const PhoneDialer = registerPlugin<PhoneDialerPlugin>('PhoneDialer', {
  web: () => import('./web').then((m) => new m.PhoneDialerWeb()),
});

export * from './definitions';
export { PhoneDialer };
