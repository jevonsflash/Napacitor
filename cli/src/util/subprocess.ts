/**
 * 子进程封装(与 Capacitor CLI 的 util/subprocess 对应,做了零依赖精简)。
 */
import { spawn } from 'node:child_process';
import type { SpawnOptions } from 'node:child_process';
import { fatal } from '../common';
import * as colors from '../colors';

/** 以透传 stdio 运行命令,非零退出码或命令不存在时终止 CLI。 */
export async function runCommand(
  command: string,
  args: string[],
  options?: SpawnOptions,
): Promise<void> {
  console.log(colors.run(`> ${command} ${args.join(' ')}`));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    child.on('error', (err: Error) => {
      reject(err);
    });
    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} 以退出码 ${code} 结束`));
      }
    });
  }).catch((err: Error) => {
    if (err.message.indexOf('ENOENT') >= 0) {
      fatal(`未找到命令 "${command}",请确认已安装并在 PATH 中`);
    }
    fatal(err.message);
  });
}
