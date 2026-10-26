/**
 * @napacitor/geolocation 类型定义。
 * 封装 .NET MAUI Geolocation / Permissions API:GPS 定位、持续监听与权限。
 */

/** GPS 坐标(与 Capacitor Geolocation 的 coords 同形)。 */
export interface GeolocationCoords {
  /** 纬度。 */
  latitude: number;
  /** 经度。 */
  longitude: number;
  /** 精度(米)。 */
  accuracy: number;
  /** 海拔(米;平台未提供时为 null)。 */
  altitude: number | null;
  /** 海拔精度(米;平台未提供时为 null)。 */
  altitudeAccuracy: number | null;
  /** 行进方向角(0-360°;平台未提供时为 null)。 */
  heading: number | null;
  /** 速度(m/s;平台未提供时为 null)。 */
  speed: number | null;
}

/** 位置信息。 */
export interface Position {
  /** 创建时间戳(Unix 毫秒)。 */
  timestamp: number;
  /** 坐标与精度。 */
  coords: GeolocationCoords;
}

/** getCurrentPosition / watchPosition 参数。 */
export interface PositionOptions {
  /** 高精度模式(映射 MAUI GeolocationAccuracy.Best)。 */
  enableHighAccuracy?: boolean;
  /** 最大等待时长(毫秒,默认 10000;须为正数)。 */
  timeout?: number;
  /** 可接受缓存位置的最大时长(毫秒;原生端忽略)。 */
  maximumAge?: number;
}

/** clearWatch 参数。 */
export interface ClearWatchOptions {
  /** watchPosition 返回的回调 ID。 */
  id: CallbackID;
}

/** watchPosition 的回调 ID。 */
export type CallbackID = string;

/** watchPosition 回调:位置更新时收到 Position,出错时首参为 null、次参为错误。 */
export type WatchPositionCallback = (
  position: Position | null,
  err?: { code: string; message: string },
) => void;

/** 权限状态(与 Capacitor 的 PermissionState 对应)。 */
export type PermissionState = 'prompt' | 'granted' | 'denied';

/** checkPermissions / requestPermissions 返回值。 */
export interface PermissionStatus {
  /** 位置权限状态(检查 LocationWhenInUse)。 */
  location: PermissionState;
  /** 粗略位置权限状态(MAUI 未区分粒度,与 location 同值)。 */
  coarseLocation: PermissionState;
}

export interface GeolocationPlugin {
  /** 获取当前位置(一次性)。 */
  getCurrentPosition(options?: PositionOptions): Promise<Position>;
  /** 持续监听位置变化;返回回调 ID(供 clearWatch 使用)。 */
  watchPosition(
    options: PositionOptions,
    callback: WatchPositionCallback,
  ): Promise<CallbackID>;
  /** 停止指定的位置监听。 */
  clearWatch(options: ClearWatchOptions): Promise<void>;
  /** 检查定位权限。 */
  checkPermissions(): Promise<PermissionStatus>;
  /** 请求定位权限(web 平台不支持)。 */
  requestPermissions(): Promise<PermissionStatus>;
}
