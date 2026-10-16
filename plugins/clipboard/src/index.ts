/**
 * @napacitor/clipboard 入口(与 @capacitor/clipboard 对应)。
 */
import { registerPlugin } from '@napacitor/core';
import type { ClipboardPlugin } from './definitions';

const Clipboard = registerPlugin<ClipboardPlugin>('Clipboard', {
  web: () => import('./web').then((m) => new m.ClipboardWeb()),
});

export * from './definitions';
export { Clipboard };
