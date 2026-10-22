/**
 * @napacitor/app-info 类型定义。
 * 封装 .NET MAUI AppInfo / VersionTracking API:获取应用信息。
 */

/** 应用信息。 */
export interface AppInfoData {
  /** 应用名称(显示名)。 */
  name: string;
  /** 包名(Android) / Bundle ID(iOS) / 应用 ID(Windows)。 */
  id: string;
  /** 版本号(如 1.2.3)。 */
  version: string;
  /** 构建号(如 100)。 */
  build: string;
  /** 主题模式:light / dark / system。 */
  theme: string;
  /** 请求布局方向:portrait / landscape / unspecified。 */
  requestedLayoutOrientation: string;
}

/** 版本跟踪信息。 */
export interface VersionTrackingData {
  /** 当前版本号。 */
  currentVersion: string;
  /** 当前构建号。 */
  currentBuild: string;
  /** 是否为首次安装。 */
  isFirstLaunchEver: boolean;
  /** 是否为当前版本首次启动。 */
  isFirstLaunchForCurrentVersion: boolean;
  /** 是否为当前构建首次启动。 */
  isFirstLaunchForCurrentBuild: boolean;
  /** 上一个版本号。 */
  previousVersion: string;
  /** 上一个构建号。 */
  previousBuild: string;
  /** 历史版本列表(由新到旧)。 */
  versionHistory: string[];
  /** 历史构建列表(由新到旧)。 */
  buildHistory: string[];
}

export interface AppInfoPlugin {
  /** 获取应用信息。 */
  getInfo(): Promise<AppInfoData>;
  /** 获取版本跟踪信息。 */
  getVersionTracking(): Promise<VersionTrackingData>;
  /** 显示应用信息对话框(部分平台)。 */
  showSettingsUI(): Promise<void>;
  /** 打开应用系统设置页面。 */
  openSettings(): Promise<void>;
}
