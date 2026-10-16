/**
 * `nap open maui` 命令入口(与 Capacitor CLI 的 tasks/open.ts 对应)。
 */
import type { CLIConfig } from '../definitions';
import { openMaui } from '../maui/open';

export async function openCommand(config: CLIConfig): Promise<void> {
  await openMaui(config);
}
