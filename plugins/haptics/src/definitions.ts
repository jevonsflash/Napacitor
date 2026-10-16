/**
 * @napacitor/haptics 类型定义(与 @capacitor/haptics 对应)。
 */

/** impact() 触觉强度(与 @capacitor/haptics 的枚举同形)。 */
export enum ImpactStyle {
  Light = 'LIGHT',
  Medium = 'MEDIUM',
  Heavy = 'HEAVY',
}

/** impact() 参数。 */
export interface ImpactOptions {
  style?: ImpactStyle;
}

/** notification() 触觉类型(与 @capacitor/haptics 的枚举同形)。 */
export enum NotificationType {
  Success = 'SUCCESS',
  Warning = 'WARNING',
  Error = 'ERROR',
}

/** notification() 参数。 */
export interface NotificationOptions {
  type?: NotificationType;
}

/** vibrate() 参数。 */
export interface VibrateOptions {
  /** 振动时长(毫秒)。 */
  duration?: number;
}

export interface HapticsPlugin {
  /** 触觉冲击。 */
  impact(options?: ImpactOptions): Promise<void>;
  /** 通知触觉。 */
  notification(options?: NotificationOptions): Promise<void>;
  /** 自定义时长振动。 */
  vibrate(options?: VibrateOptions): Promise<void>;
  /** 选择变化触觉(轻微)。 */
  selection(): Promise<void>;
  /** 选择开始触觉(轻微)。 */
  selectionChanged(): Promise<void>;
}
