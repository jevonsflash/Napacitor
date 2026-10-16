/**
 * @napacitor/device 入口(与 @capacitor/device 对应)。
 */
import { registerPlugin } from '@napacitor/core';
import type { DevicePlugin } from './definitions';

const Device = registerPlugin<DevicePlugin>('Device', {
  web: () => import('./web').then((m) => new m.DeviceWeb()),
});

export * from './definitions';
export { Device };
