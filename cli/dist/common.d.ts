/** 终止 CLI:打印红色错误并退出。 */
export declare function fatal(message: string): never;
/** 打印任务标题(与 Capacitor 的 runTask 对应;无 spinner,直接顺序输出)。 */
export declare function runTask<T>(title: string, fn: () => Promise<T>): Promise<T>;
/** 断言:值为假时 fatal。 */
export declare function check(value: unknown, message: string): void;
