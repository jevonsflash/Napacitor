/**
 * @napacitor/flashlight 类型定义。
 * 封装 .NET MAUI Flashlight API:控制设备手电筒。
 */

/** 手电筒开关选项。 */
export interface FlashlightOptions {
  /** 亮度级别(0.0 - 1.0);仅部分平台支持,默认 1.0。 */
  intensity?: number;
}

/** 手电筒状态查询结果。 */
export interface FlashlightStateResult {
  /** 手电筒是否当前开启。 */
  isOn: boolean;
}

/** 支持检测结果。 */
export interface FlashlightSupportedResult {
  /** 当前设备是否支持手电筒。 */
  supported: boolean;
}

export interface FlashlightPlugin {
  /** 检查当前设备是否支持手电筒。 */
  isSupported(): Promise<FlashlightSupportedResult>;
  /** 打开手电筒。 */
  switchOn(options?: FlashlightOptions): Promise<void>;
  /** 关闭手电筒。 */
  switchOff(): Promise<void>;
  /** 切换手电筒状态。 */
  toggle(options?: FlashlightOptions): Promise<void>;
  /** 查询手电筒当前状态。 */
  getState(): Promise<FlashlightStateResult>;
}
