/**
 * @napacitor/share 入口(与 @capacitor/share 对应)。
 */
import { registerPlugin } from '@napacitor/core';
import type { SharePlugin } from './definitions';

const Share = registerPlugin<SharePlugin>('Share', {
  web: () => import('./web').then((m) => new m.ShareWeb()),
});

export * from './definitions';
export { Share };
