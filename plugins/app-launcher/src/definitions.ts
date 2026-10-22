/**
 * @napacitor/app-launcher 类型定义。
 * 封装 .NET MAUI Launcher / Map API:打开其他应用、URL、地图等。
 */

/** openUrl() 参数。 */
export interface OpenUrlOptions {
  /** 要打开的 URL(支持 http/https/mailto/tel/geo 等协议)。 */
  url: string;
}

/** openApp() 参数(通过包名/应用 ID 打开)。 */
export interface OpenAppOptions {
  /** Android 包名 / iOS Bundle ID / Windows 应用协议。 */
  appId: string;
}

/** canOpenUrl() 返回结构。 */
export interface CanOpenUrlResult {
  /** 当前平台是否能处理该 URL。 */
  canOpen: boolean;
}

/** canOpenApp() 返回结构。 */
export interface CanOpenAppResult {
  /** 当前平台是否安装了该应用。 */
  canOpen: boolean;
}

/** openMap() 参数。 */
export interface OpenMapOptions {
  /** 纬度。 */
  latitude: number;
  /** 经度。 */
  longitude: number;
  /** 地图标签(可选)。 */
  label?: string;
  /** 导航模式:driving / walking / transit(可选,仅部分平台支持)。 */
  navigationMode?: string;
}

export interface AppLauncherPlugin {
  /** 打开 URL(浏览器 / 系统处理)。 */
  openUrl(options: OpenUrlOptions): Promise<void>;
  /** 检查是否能处理该 URL。 */
  canOpenUrl(options: OpenUrlOptions): Promise<CanOpenUrlResult>;
  /** 通过包名打开应用。 */
  openApp(options: OpenAppOptions): Promise<void>;
  /** 检查是否安装了指定应用。 */
  canOpenApp(options: OpenAppOptions): Promise<CanOpenAppResult>;
  /** 打开系统地图并定位到指定坐标。 */
  openMap(options: OpenMapOptions): Promise<void>;
}
