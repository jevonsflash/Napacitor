/**
 * @napacitor/haptics 入口(与 @capacitor/haptics 对应)。
 */
import { registerPlugin } from '@napacitor/core';
import type { HapticsPlugin } from './definitions';

const Haptics = registerPlugin<HapticsPlugin>('Haptics', {
  web: () => import('./web').then((m) => new m.HapticsWeb()),
});

export * from './definitions';
export { Haptics };
