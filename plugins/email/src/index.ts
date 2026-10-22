/**
 * @napacitor/email 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { EmailPlugin } from './definitions';

const Email = registerPlugin<EmailPlugin>('Email', {
  web: () => import('./web').then((m) => new m.EmailWeb()),
});

export * from './definitions';
export { Email };
