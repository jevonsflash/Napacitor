import type { CLIConfig } from '../definitions';
/** 唯一支持的平台名。 */
export declare const PLATFORM_NAME = "maui";
/** 宿主工程目录(绝对路径)。 */
export declare function hostDirAbs(config: CLIConfig): string;
/** 宿主 wwwroot 目录(绝对路径)。 */
export declare function wwwrootDirAbs(config: CLIConfig): string;
/** 宿主工程文件(绝对路径)。 */
export declare function hostCsprojPath(config: CLIConfig): string;
/** 断言宿主工程已添加(未 add 时给出提示)。 */
export declare function requireHost(config: CLIConfig): Promise<void>;
/**
 * 定位 maui-template 模板目录:随 @napacitor/cli 包分发的 assets/maui-template
 * (npm 安装布局,与 Capacitor 把平台模板归档内置于 cli 包 assets 的做法一致)。
 */
export declare function resolveTemplateDir(): Promise<string>;
