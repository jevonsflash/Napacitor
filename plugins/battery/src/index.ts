/**
 * @napacitor/battery 入口(与 @capacitor/battery 对应)。
 */
import { registerPlugin } from '@napacitor/core';
import type { BatteryPlugin } from './definitions';

const Battery = registerPlugin<BatteryPlugin>('Battery', {
  web: () => import('./web').then((m) => new m.BatteryWeb()),
});

export * from './definitions';
export { Battery };
