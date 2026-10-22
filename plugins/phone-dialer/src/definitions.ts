/**
 * @napacitor/phone-dialer 类型定义。
 * 封装 .NET MAUI PhoneDialer API:拨打电话。
 */

/** 拨号选项。 */
export interface DialOptions {
  /** 电话号码。 */
  number: string;
}

/** 支持检测结果。 */
export interface PhoneDialerSupportedResult {
  /** 当前设备是否支持拨打电话。 */
  supported: boolean;
}

export interface PhoneDialerPlugin {
  /** 检查是否支持拨打电话。 */
  isSupported(): Promise<PhoneDialerSupportedResult>;
  /** 拨打电话(打开系统拨号界面)。 */
  open(options: DialOptions): Promise<void>;
}
