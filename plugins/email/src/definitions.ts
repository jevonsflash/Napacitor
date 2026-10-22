/**
 * @napacitor/email 类型定义。
 * 封装 .NET MAUI Email API:发送电子邮件。
 */

/** 邮件编写选项。 */
export interface ComposeOptions {
  /** 收件人列表。 */
  to?: string[];
  /** 抄送列表。 */
  cc?: string[];
  /** 密送列表。 */
  bcc?: string[];
  /** 邮件主题。 */
  subject?: string;
  /** 邮件正文。 */
  body?: string;
  /** 是否为 HTML 格式。 */
  isHtml?: boolean;
  /** 附件列表(文件路径)。 */
  attachments?: string[];
}

/** 支持检测结果。 */
export interface EmailSupportedResult {
  /** 当前设备是否支持发送邮件。 */
  supported: boolean;
}

export interface EmailPlugin {
  /** 检查是否支持发送邮件。 */
  isSupported(): Promise<EmailSupportedResult>;
  /** 编写并发送邮件(打开系统邮件客户端)。 */
  compose(options?: ComposeOptions): Promise<void>;
}
