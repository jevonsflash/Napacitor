/**
 * `nap sync [maui]` 命令入口(与 Capacitor CLI 的 tasks/sync.ts 对应)。
 * sync = copy(复制 Web 产物)+ update(重新生成 napacitor.build.props)。
 */
import type { CLIConfig } from '../definitions';
export declare function syncCommand(config: CLIConfig): Promise<void>;
