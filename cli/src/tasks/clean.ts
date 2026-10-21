/**
 * `nap clean [maui]` 命令入口(面向 dotnet 的命令传递)。
 */
import type { CLIConfig, TargetOptions } from '../definitions';
import { cleanMaui } from '../maui/clean';

export async function cleanCommand(
  config: CLIConfig,
  options: TargetOptions,
): Promise<void> {
  await cleanMaui(config, options);
}
