/**
 * `nap add maui` 命令入口(与 Capacitor CLI 的 tasks/add.ts 对应)。
 * 平台参数已由入口(index.ts)校验为 'maui'。
 */
import type { CLIConfig } from '../definitions';
export declare function addCommand(config: CLIConfig): Promise<void>;
