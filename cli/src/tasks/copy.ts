/**
 * `nap copy [maui]` 命令入口(与 Capacitor CLI 的 tasks/copy.ts 对应)。
 */
import type { CLIConfig } from '../definitions';
import { copyMaui } from '../maui/copy';

export async function copyCommand(config: CLIConfig): Promise<void> {
  await copyMaui(config);
}
