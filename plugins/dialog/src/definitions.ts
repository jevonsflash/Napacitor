/**
 * @napacitor/dialog 类型定义。
 * 原生对话框:alert / prompt / confirm
 * (映射 MAUI Page.DisplayAlert / DisplayPromptAsync;Windows 上由 MAUI 落到 ContentDialog)。
 */

/** alert() 参数。 */
export interface AlertOptions {
  /** 对话框标题。 */
  title: string;
  /** 对话框消息。 */
  message: string;
  /** 按钮文案(默认 'OK')。 */
  buttonTitle?: string;
}

/** prompt() 参数。 */
export interface PromptOptions {
  /** 对话框标题。 */
  title: string;
  /** 对话框消息。 */
  message: string;
  /** 确认按钮文案(默认 'OK')。 */
  okButtonTitle?: string;
  /** 取消按钮文案(默认 'Cancel')。 */
  cancelButtonTitle?: string;
  /** 输入框占位提示。 */
  inputPlaceholder?: string;
  /** 输入框预填文本。 */
  inputText?: string;
}

/** prompt() 返回值。 */
export interface PromptResult {
  /** 输入的文本(取消时为空字符串)。 */
  value: string;
  /** 是否被取消。 */
  cancelled: boolean;
}

/** confirm() 参数。 */
export interface ConfirmOptions {
  /** 对话框标题。 */
  title: string;
  /** 对话框消息。 */
  message: string;
  /** 确认按钮文案(默认 'OK')。 */
  okButtonTitle?: string;
  /** 取消按钮文案(默认 'Cancel')。 */
  cancelButtonTitle?: string;
}

/** confirm() 返回值。 */
export interface ConfirmResult {
  /** 点击确认按钮时为 true。 */
  value: boolean;
}

export interface DialogPlugin {
  /** 显示警告对话框。 */
  alert(options: AlertOptions): Promise<void>;
  /** 显示输入对话框。 */
  prompt(options: PromptOptions): Promise<PromptResult>;
  /** 显示确认对话框。 */
  confirm(options: ConfirmOptions): Promise<ConfirmResult>;
}
