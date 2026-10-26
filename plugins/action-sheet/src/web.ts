/**
 * @napacitor/action-sheet 浏览器实现。
 * Capacitor 依赖 pwa-elements 渲染样式化操作表;Napacitor 0.1 暂无对应
 * UI 元素,调用时抛出不支持错误。
 */
import type { ShowActionsOptions, ShowActionsResult } from './definitions';

export class ActionSheetWeb {
  async showActions(_options: ShowActionsOptions): Promise<ShowActionsResult> {
    throw new Error(
      'ActionSheet.showActions:web 平台需要 UI 元素支持(Napacitor 0.1 暂未提供)');
  }
}
