/**
 * `nap open maui`:用系统默认方式打开宿主工程(与 Capacitor CLI 的 open.ts 对应)。
 */
import { runTask } from '../common';
import { runCommand } from '../util/subprocess';
import { hostCsprojPath, requireHost } from './common';
import type { CLIConfig } from '../definitions';

export async function openMaui(config: CLIConfig): Promise<void> {
  await requireHost(config);
  const csproj = hostCsprojPath(config);
  await runTask(`打开宿主工程(${csproj})`, async () => {
    if (process.platform === 'win32') {
      await runCommand('cmd', ['/c', 'start', '', csproj]);
    } else if (process.platform === 'darwin') {
      await runCommand('open', [csproj]);
    } else {
      await runCommand('xdg-open', [csproj]);
    }
  });
}
