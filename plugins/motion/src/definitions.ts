/**
 * @napacitor/motion 类型定义。
 * 统一封装 .NET MAUI 五类传感器:
 *   Accelerometer(加速度计)、Gyroscope(陀螺仪)、Magnetometer(磁力计)、
 *   Compass(指南针)、Barometer(气压计)。
 */
import type { PluginListenerHandle } from '@napacitor/core';

/* ─── 枚举 ─────────────────────────────────────────────────── */

/** 传感器采样速率(与 MAUI SensorSpeed 枚举对应)。 */
export enum SensorSpeed {
  /** 默认速率(约 200ms / 5Hz)。 */
  Default = 'DEFAULT',
  /** 适合 UI 交互(约 60ms / ~17Hz)。 */
  Ui = 'UI',
  /** 适合游戏(约 40ms / 25Hz)。 */
  Game = 'GAME',
  /** 最快(约 20ms / 50Hz)。 */
  Fastest = 'FASTEST',
}

/** 指南针校准模式(与 MAUI CompassCalibration 枚举对应)。 */
export enum CompassCalibration {
  /** 无校准。 */
  Unreliable = 'UNRELIABLE',
  /** 低精度校准。 */
  LowAccuracy = 'LOW_ACCURACY',
  /** 中精度校准。 */
  MediumAccuracy = 'MEDIUM_ACCURACY',
  /** 高精度校准。 */
  HighAccuracy = 'HIGH_ACCURACY',
}

/* ─── 通用 ─────────────────────────────────────────────────── */

/** 传感器支持检测结果。 */
export interface SensorSupportedResult {
  supported: boolean;
}

/** start*() 参数。 */
export interface StartSensorOptions {
  /** 采样速率(默认 DEFAULT)。 */
  speed?: SensorSpeed;
}

/* ─── 三轴向量读数 ─────────────────────────────────────────── */

/** 三轴读数(加速度计 / 陀螺仪 / 磁力计共用结构)。 */
export interface AxisReading {
  /** X 轴分量。 */
  x: number;
  /** Y 轴分量。 */
  y: number;
  /** Z 轴分量。 */
  z: number;
}

/* ─── 指南针 ───────────────────────────────────────────────── */

/** 指南针读数。 */
export interface CompassReading {
  /** 磁北方向角(0-360°,0=正北,顺时针递增)。 */
  headingMagnetic: number;
  /** 真北方向角(仅部分平台提供;不支持时为 -1)。 */
  headingTrue: number;
  /** 校准精度等级。 */
  calibration: CompassCalibration;
}

/* ─── 气压计 ───────────────────────────────────────────────── */

/** 气压计读数。 */
export interface BarometerReading {
  /** 大气压强(hPa / 百帕)。 */
  pressure: number;
}

/* ─── 事件回调 ─────────────────────────────────────────────── */

export type AccelerometerCallback = (reading: AxisReading) => void;
export type GyroscopeCallback = (reading: AxisReading) => void;
export type MagnetometerCallback = (reading: AxisReading) => void;
export type CompassCallback = (reading: CompassReading) => void;
export type BarometerCallback = (reading: BarometerReading) => void;

/* ─── 插件接口 ─────────────────────────────────────────────── */

export interface MotionPlugin {
  /* ── 支持检测 ── */
  /** 检查加速度计是否可用。 */
  isAccelerometerSupported(): Promise<SensorSupportedResult>;
  /** 检查陀螺仪是否可用。 */
  isGyroscopeSupported(): Promise<SensorSupportedResult>;
  /** 检查磁力计是否可用。 */
  isMagnetometerSupported(): Promise<SensorSupportedResult>;
  /** 检查指南针是否可用。 */
  isCompassSupported(): Promise<SensorSupportedResult>;
  /** 检查气压计是否可用。 */
  isBarometerSupported(): Promise<SensorSupportedResult>;

  /* ── 启动 / 停止 ── */
  /** 启动加速度计监听。 */
  startAccelerometer(options?: StartSensorOptions): Promise<void>;
  /** 停止加速度计。 */
  stopAccelerometer(): Promise<void>;
  /** 启动陀螺仪监听。 */
  startGyroscope(options?: StartSensorOptions): Promise<void>;
  /** 停止陀螺仪。 */
  stopGyroscope(): Promise<void>;
  /** 启动磁力计监听。 */
  startMagnetometer(options?: StartSensorOptions): Promise<void>;
  /** 停止磁力计。 */
  stopMagnetometer(): Promise<void>;
  /** 启动指南针监听。 */
  startCompass(options?: StartSensorOptions): Promise<void>;
  /** 停止指南针。 */
  stopCompass(): Promise<void>;
  /** 启动气压计监听。 */
  startBarometer(options?: StartSensorOptions): Promise<void>;
  /** 停止气压计。 */
  stopBarometer(): Promise<void>;

  /* ── 事件监听 ── */
  addListener(
    eventName: 'accelerometerReading',
    callback: AccelerometerCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'gyroscopeReading',
    callback: GyroscopeCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'magnetometerReading',
    callback: MagnetometerCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'compassReading',
    callback: CompassCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'barometerReading',
    callback: BarometerCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
