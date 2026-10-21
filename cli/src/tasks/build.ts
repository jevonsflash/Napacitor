/**
 * `nap build [maui]` 命令入口(面向 dotnet 的命令传递)。
 */
import type { CLIConfig, TargetOptions } from '../definitions';
import { buildMaui } from '../maui/build';

export async function buildCommand(
  config: CLIConfig,
  options: TargetOptions,
): Promise<void> {
  await buildMaui(config, options);
}
