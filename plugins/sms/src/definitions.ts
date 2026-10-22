/**
 * @napacitor/sms 类型定义。
 * 封装 .NET MAUI Sms API:发送短信。
 */

/** 短信发送选项。 */
export interface SmsOptions {
  /** 收件人手机号列表。 */
  recipients: string[];
  /** 短信正文。 */
  body?: string;
}

/** 支持检测结果。 */
export interface SmsSupportedResult {
  /** 当前设备是否支持发送短信。 */
  supported: boolean;
}

export interface SmsPlugin {
  /** 检查是否支持发送短信。 */
  isSupported(): Promise<SmsSupportedResult>;
  /** 发送短信(打开系统短信客户端)。 */
  send(options: SmsOptions): Promise<void>;
}
