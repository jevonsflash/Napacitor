/**
 * @napacitor/app-actions 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { AppActionsPlugin } from './definitions';

const AppActions = registerPlugin<AppActionsPlugin>('AppActions', {
  web: () => import('./web').then((m) => new m.AppActionsWeb()),
});

export * from './definitions';
export { AppActions };
