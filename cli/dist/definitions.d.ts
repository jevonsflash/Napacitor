/**
 * CLI 类型定义(与 Capacitor CLI 的 definitions.ts 对应)。
 */
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
/** `nap run` 选项。 */
export interface RunOptions {
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
