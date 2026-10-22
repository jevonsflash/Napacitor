/**
 * @napacitor/app-info 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { AppInfoPlugin } from './definitions';

const AppInfo = registerPlugin<AppInfoPlugin>('AppInfo', {
  web: () => import('./web').then((m) => new m.AppInfoWeb()),
});

export * from './definitions';
export { AppInfo };
