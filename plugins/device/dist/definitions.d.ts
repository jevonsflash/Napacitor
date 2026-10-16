/**
 * @napacitor/device 类型定义(与 @capacitor/device 对应)。
 */
export interface DeviceInfo {
    /** 设备型号(如 iPhone13,2)。 */
    model: string;
    /** 平台:android / ios / mac / windows / web。 */
    platform: string;
    /** 操作系统版本。 */
    osVersion: string;
    /** 制造商。 */
    manufacturer: string;
    /** 是否为模拟器/虚拟设备。 */
    isVirtual: boolean;
    /** 设备名称(部分平台提供)。 */
    name?: string;
}
export interface GetLanguageCodeResult {
    /** 当前 UI 语言代码(如 zh、en)。 */
    value: string;
}
export interface GetLocaleResult {
    /** 当前区域设置(如 zh-CN)。 */
    value: string;
}
export interface DevicePlugin {
    /** 获取设备信息。 */
    getInfo(): Promise<DeviceInfo>;
    /** 获取当前 UI 语言代码。 */
    getLanguageCode(): Promise<GetLanguageCodeResult>;
    /** 获取当前区域设置。 */
    getLocale(): Promise<GetLocaleResult>;
}
