/**
 * @napacitor/dialog 浏览器实现(基于 window.alert / confirm / prompt,
 * 与 @capacitor/dialog 的 web 实现对应;Capacitor 依赖 pwa-elements,
 * 此处用原生对话框兜底)。
 */
import type {
  AlertOptions,
  ConfirmOptions,
  ConfirmResult,
  PromptOptions,
  PromptResult,
} from './definitions';

export class DialogWeb {
  async alert(options: AlertOptions): Promise<void> {
    window.alert(`${options.title ?? ''}\n${options.message ?? ''}`.trim());
  }

  async confirm(options: ConfirmOptions): Promise<ConfirmResult> {
    const value = window.confirm(
      `${options.title ?? ''}\n${options.message ?? ''}`.trim());
    return { value };
  }

  async prompt(options: PromptOptions): Promise<PromptResult> {
    const value = window.prompt(
      `${options.title ?? ''}\n${options.message ?? ''}`.trim(),
      options.inputText ?? '');
    return { value: value ?? '', cancelled: value === null };
  }
}
