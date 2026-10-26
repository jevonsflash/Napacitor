/**
 * @napacitor/preferences 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { PreferencesPlugin } from './definitions';

const Preferences = registerPlugin<PreferencesPlugin>('Preferences', {
  web: () => import('./web').then((m) => new m.PreferencesWeb()),
});

export * from './definitions';
export { Preferences };
