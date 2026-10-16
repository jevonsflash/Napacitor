/**
 * `nap sync [maui]` 命令入口(与 Capacitor CLI 的 tasks/sync.ts 对应)。
 * sync = copy(复制 Web 产物)+ update(重新生成 napacitor.build.props)。
 */
import type { CLIConfig } from '../definitions';
import { copyMaui } from '../maui/copy';
import { updateMaui } from '../maui/update';

export async function syncCommand(config: CLIConfig): Promise<void> {
  await copyMaui(config);
  await updateMaui(config);
  console.log('\n✓ sync 完成:wwwroot 已更新,napacitor.build.props 已重新生成');
}
