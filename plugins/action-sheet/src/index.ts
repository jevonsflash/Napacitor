/**
 * @napacitor/action-sheet 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { ActionSheetPlugin } from './definitions';

const ActionSheet = registerPlugin<ActionSheetPlugin>('ActionSheet', {
  web: () => import('./web').then((m) => new m.ActionSheetWeb()),
});

export * from './definitions';
export { ActionSheet };
