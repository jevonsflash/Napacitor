/**
 * @napacitor/display 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { DisplayPlugin } from './definitions';

const Display = registerPlugin<DisplayPlugin>('Display', {
  web: () => import('./web').then((m) => new m.DisplayWeb()),
});

export * from './definitions';
export { Display };
