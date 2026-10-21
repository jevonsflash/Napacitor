/**
 * `nap clean maui`:清理宿主构建产物 —— 面向 dotnet 的命令传递。
 * 底层执行 `dotnet clean <宿主> -f <TFM> -c <Debug|Release>`。
 * 注意:应用仍在运行时会锁定输出目录的 DLL(Windows 上尤其如此),
 * 请先停止应用再 clean,否则删除/清理会失败。
 */
import type { CLIConfig, TargetOptions } from '../definitions';
import { runTask } from '../common';
import { runCommand } from '../util/subprocess';
import { hostCsprojPath, requireHost, resolveTargetTfm } from './common';

export async function cleanMaui(
  config: CLIConfig,
  options: TargetOptions,
): Promise<void> {
  await requireHost(config);

  const csproj = hostCsprojPath(config);
  const { target, tfm } = await resolveTargetTfm(csproj, options.target);
  const configuration = options.configuration ?? 'Debug';

  await runTask(
    `清理宿主构建产物(target: ${target},TFM: ${tfm},配置: ${configuration})`,
    async () => {
      await runCommand('dotnet', [
        'clean', csproj, '-f', tfm, '-c', configuration,
      ]);
    },
  );
}
