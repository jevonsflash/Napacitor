import type { CLIConfig } from './definitions';
/**
 * 加载并校验 napacitor.config.json。
 * 文件缺失或必填字段(appId / appName / webDir)非法时终止 CLI。
 */
export declare function loadConfig(appDir: string): Promise<CLIConfig>;
