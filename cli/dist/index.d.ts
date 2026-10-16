/**
 * @napacitor/cli 入口(与 Capacitor CLI 的 index.ts 对应):
 * 命令分发 + help + 轻量 argv 解析(零依赖,替代 minimist)。
 */
import type { ParsedArgs } from './definitions';
/** 解析 argv:位置参数与 --key value / -k value 选项(替代 minimist)。 */
export declare function parseArgs(argv: string[]): ParsedArgs;
/** 命令分发(run 仅供 bin 调用;导出便于测试)。 */
export declare function run(argv: string[]): Promise<void>;
/** bin 入口:捕获未处理异常并红字退出。 */
export declare function main(): Promise<void>;
