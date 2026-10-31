/**
 * @napacitor/camera 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { CameraPlugin } from './definitions';

const Camera = registerPlugin<CameraPlugin>('Camera', {
  web: () => import('./web').then((m) => new m.CameraWeb()),
});

export * from './definitions';
export { Camera };
