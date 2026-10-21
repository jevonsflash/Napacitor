/**
 * `nap build maui`:构建宿主工程 —— 面向 dotnet 的命令传递。
 * 底层执行 `dotnet build <宿主> -f <TFM> -c <Debug|Release>`。
 * Windows 上 .NET SDK 的 Run target 不依赖 Build(见 run.ts 注释),
 * `nap run` 已用组合 target 根治;本命令供单独构建使用(如 CI、
 * 首次运行前预检、或排查应用侧启动失败时区分构建/运行两阶段)。
 */
import type { CLIConfig, TargetOptions } from '../definitions';
import { runTask } from '../common';
import { runCommand } from '../util/subprocess';
import { hostCsprojPath, requireHost, resolveTargetTfm } from './common';

export async function buildMaui(
  config: CLIConfig,
  options: TargetOptions,
): Promise<void> {
  await requireHost(config);

  const csproj = hostCsprojPath(config);
  const { target, tfm } = await resolveTargetTfm(csproj, options.target);
  const configuration = options.configuration ?? 'Debug';

  await runTask(
    `构建宿主(target: ${target},TFM: ${tfm},配置: ${configuration})`,
    async () => {
      await runCommand('dotnet', [
        'build', csproj, '-f', tfm, '-c', configuration,
      ]);
    },
  );
}
