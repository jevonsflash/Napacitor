/**
 * @napacitor/security 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { SecurityPlugin } from './definitions';

const Security = registerPlugin<SecurityPlugin>('Security', {
  web: () => import('./web').then((m) => new m.SecurityWeb()),
});

export * from './definitions';
export { Security };
