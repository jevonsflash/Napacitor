import type { SpawnOptions } from 'node:child_process';
/** 以透传 stdio 运行命令,非零退出码或命令不存在时终止 CLI。 */
export declare function runCommand(command: string, args: string[], options?: SpawnOptions): Promise<void>;
