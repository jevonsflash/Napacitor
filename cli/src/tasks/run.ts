/**
 * `nap run [maui]` 命令入口(与 Capacitor CLI 的 tasks/run.ts 对应)。
 */
import type { CLIConfig, RunOptions } from '../definitions';
import { runMaui } from '../maui/run';

export async function runTaskCommand(
  config: CLIConfig,
  options: RunOptions,
): Promise<void> {
  await runMaui(config, options);
}
