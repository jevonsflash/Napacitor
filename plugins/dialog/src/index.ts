/**
 * @napacitor/dialog 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { DialogPlugin } from './definitions';

const Dialog = registerPlugin<DialogPlugin>('Dialog', {
  web: () => import('./web').then((m) => new m.DialogWeb()),
});

export * from './definitions';
export { Dialog };
