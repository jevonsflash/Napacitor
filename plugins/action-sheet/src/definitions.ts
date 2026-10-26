/**
 * @napacitor/action-sheet 类型定义。
 * 原生操作表(映射 MAUI Page.DisplayActionSheet)。
 */

/** 按钮风格(仅 iOS 生效;其余平台忽略)。 */
export enum ActionSheetButtonStyle {
  /** 默认。 */
  Default = 'DEFAULT',
  /** 破坏性操作(红色)。 */
  Destructive = 'DESTRUCTIVE',
  /** 取消。 */
  Cancel = 'CANCEL',
}

/** 操作表按钮。 */
export interface ActionSheetButton {
  /** 按钮文案。 */
  title: string;
  /** 按钮风格(仅 iOS 生效;其余平台忽略)。 */
  style?: ActionSheetButtonStyle;
  /** 按钮图标(仅 web 生效)。 */
  icon?: string;
}

/** showActions() 参数。 */
export interface ShowActionsOptions {
  /** 操作表标题。 */
  title: string;
  /** 标题下的消息(仅 iOS 生效)。 */
  message?: string;
  /** 可选项。 */
  options: ActionSheetButton[];
  /** 点击表外区域是否可取消(默认 false)。 */
  cancelable?: boolean;
}

/** showActions() 返回值。 */
export interface ShowActionsResult {
  /** 被点击选项的下标(从 0 起);被取消时为 -1。 */
  index: number;
  /** 是否被取消。 */
  canceled: boolean;
}

export interface ActionSheetPlugin {
  /** 显示操作表。 */
  showActions(options: ShowActionsOptions): Promise<ShowActionsResult>;
}
