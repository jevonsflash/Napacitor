/**
 * @napacitor/share 类型定义(与 @capacitor/share 对应)。
 */

/** share() 参数。 */
export interface ShareOptions {
  /** 分享主题(部分平台作为邮件主题等使用)。 */
  title?: string;
  /** 分享文本。 */
  text?: string;
  /** 分享链接(与 text 可同时提供)。 */
  url?: string;
  /** 分享面板标题(Android 选择器等)。 */
  dialogTitle?: string;
}

/** canShare() 返回结构。 */
export interface CanShareResult {
  /** 当前平台是否支持分享。 */
  canShare: boolean;
}

export interface SharePlugin {
  /** 弹出系统分享面板。 */
  share(options: ShareOptions): Promise<void>;
  /** 当前平台是否支持分享。 */
  canShare(): Promise<CanShareResult>;
}
