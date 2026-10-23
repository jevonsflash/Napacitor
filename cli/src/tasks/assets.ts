/**
 * `nap assets [maui]` 命令入口(与 Capacitor 生态的 @capacitor/assets 对应,
 * 但采用 MAUI 原生 Resizetizer 方案,无需独立 npm 工具)。
 * 平台参数已由入口(index.ts)校验为 'maui'。
 */
import type { CLIConfig } from '../definitions';
import { generateAssets } from '../maui/assets';

export async function assetsCommand(config: CLIConfig): Promise<void> {
  await generateAssets(config);
}
