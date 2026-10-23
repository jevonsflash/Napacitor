/**
 * CLI 类型定义(与 Capacitor CLI 的 definitions.ts 对应)。
 */

/**
 * 日志行为(与 napacitor.config.json 的 loggingBehavior 对应,
 * 语义同 Capacitor):none=永不输出;debug=仅 Debug 构建(缺省);
 * production=始终输出(含 Release)。覆盖 C# 运行时日志与 JS console 转发。
 */
export type LoggingBehavior = 'none' | 'debug' | 'production';

/**
 * napacitor.config.json 的 assets 配置节(nap assets / nap add maui 消费):
 * 图标与启动图源文件 + 主题颜色,最终由 MAUI Resizetizer 在构建时
 * 生成各平台位图(app-icons / splashscreen 原生方案)。
 */
export interface AssetsConfig {
  /** 资产源目录(相对 appDir,默认 assets)。 */
  sourceDir: string;
  /** 图标源文件(相对 sourceDir,svg/png;缺省按约定名 icon.svg/icon.png 查找)。 */
  icon?: string;
  /** 图标前景源文件(相对 sourceDir;与 icon 组成前景+背景模式,映射 MauiIcon ForegroundFile)。 */
  iconForeground?: string;
  /** 启动图源文件(相对 sourceDir,svg/png;缺省按约定名 splash.svg/splash.png 查找)。 */
  splash?: string;
  /** 图标背景色值(写入 csproj 的 <MauiIcon Color>,默认 #512BD4)。 */
  iconColor?: string;
  /** 启动图背景色值(写入 csproj 的 <MauiSplashScreen Color>,默认 #512BD4)。 */
  splashColor?: string;
  /** 启动图 BaseSize(svg 矢量基准尺寸,仅 svg 源生效,默认 "128,128")。 */
  splashBaseSize?: string;
  /** 注入 Resources/Styles/Colors.xaml 的颜色资源(XAML x:Key → 色值)。 */
  colors?: Record<string, string>;
}

/** napacitor.config.json 的运行时形态(CLI 视角)。 */
export interface CLIConfig {
  /** 应用根目录(包含 napacitor.config.json 与 package.json)。 */
  appDir: string;
  /** 应用标识,如 com.example.app(写入宿主 csproj 的 ApplicationId)。 */
  appId: string;
  /** 应用显示名(写入宿主 csproj 的 ApplicationTitle)。 */
  appName: string;
  /** Web 应用构建产物目录(相对 appDir,如 dist)。 */
  webDir: string;
  /** 日志行为:none=不输出;debug=仅 Debug 构建(缺省);production=始终输出。 */
  loggingBehavior: LoggingBehavior;
  /** 资产生成配置节(nap assets 消费;nap add maui 用其颜色初始化模板)。 */
  assets?: AssetsConfig;
  /** MAUI 平台配置。 */
  maui: {
    /** 宿主工程目录(相对 appDir,默认 maui)。 */
    hostDir: string;
  };
  /** 插件配置节:plugins.<PluginName>。 */
  plugins: Record<string, Record<string, unknown>>;
  /** napacitor.config.json 原始内容(透传给原生端)。 */
  raw: Record<string, unknown>;
}

/** `nap build` / `nap clean` / `nap run` 的共用选项。 */
export interface TargetOptions {
  /** 目标平台:windows / android / ios / maccatalyst。 */
  target?: string;
  /** 构建配置:Debug(默认)/ Release。 */
  configuration?: string;
}

/** 命令行解析结果:位置参数与 --key value 选项。 */
export interface ParsedArgs {
  args: string[];
  options: Record<string, string>;
}
