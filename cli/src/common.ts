/**
 * CLI 公共助手(与 Capacitor CLI 的 common.ts 对应,做了零依赖精简)。
 */
import * as colors from './colors';

/** 终止 CLI:打印红色错误并退出。 */
export function fatal(message: string): never {
  console.error(colors.fail(`✖ ${message}`));
  process.exit(1);
}

/** 打印任务标题(与 Capacitor 的 runTask 对应;无 spinner,直接顺序输出)。 */
export async function runTask<T>(title: string, fn: () => Promise<T>): Promise<T> {
  console.log(`\n${colors.strong(title)}`);
  return fn();
}

/** 断言:值为假时 fatal。 */
export function check(value: unknown, message: string): void {
  if (!value) {
    fatal(message);
  }
}
