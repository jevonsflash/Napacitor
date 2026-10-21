/**
 * `nap run maui`:构建并运行宿主工程(与 Capacitor CLI 的 run.ts 对应)。
 * 底层执行 `dotnet build <宿主> -t:Run -f <TFM> -c <Debug|Release>`。
 */
import type { CLIConfig, TargetOptions } from '../definitions';
import { runTask } from '../common';
import { runCommand } from '../util/subprocess';
import { hostCsprojPath, requireHost, resolveTargetTfm } from './common';

export async function runMaui(
  config: CLIConfig,
  options: TargetOptions,
): Promise<void> {
  await requireHost(config);

  const csproj = hostCsprojPath(config);
  const { target, tfm } = await resolveTargetTfm(csproj, options.target);
  const configuration = options.configuration ?? 'Debug';

  await runTask(
    `构建并运行(target: ${target},TFM: ${tfm},配置: ${configuration})`,
    async () => {
      await runCommand('dotnet', [
        'build', csproj, '-t:Run', '-f', tfm, '-c', configuration,
      ]);
    },
  );
}
