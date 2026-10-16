/**
 * 最小 Node API 类型声明 —— src/typings.d.ts
 *
 * Napacitor CLI 零 npm 依赖(包括 devDependencies),因此不使用 @types/node。
 * 本文件声明 CLI 实际用到的少量 Node 内建 API;
 * 若日后引入 @types/node,可删除本文件与 tsconfig 的 types 约定。
 */

declare var process: {
  argv: string[];
  cwd(): string;
  platform: string;
  exit(code?: number): never;
  env: Record<string, string | undefined>;
  stdout: { write(chunk: string): boolean; isTTY?: boolean };
  stderr: { write(chunk: string): boolean };
};

/** CommonJS 模块目录(tsc 以 CommonJS 输出时可用)。 */
declare var __dirname: string;

declare module 'node:fs/promises' {
  export interface Dirent {
    name: string;
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
  }
  export interface Stats {
    isFile(): boolean;
    isDirectory(): boolean;
    isSymbolicLink(): boolean;
    size: number;
    mtimeMs: number;
  }
  export function stat(path: string): Promise<Stats>;
  export function access(path: string): Promise<void>;
  export function readFile(path: string, encoding: 'utf8'): Promise<string>;
  export function writeFile(path: string, data: string): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export function readdir(
    path: string,
    options: { withFileTypes: true },
  ): Promise<Dirent[]>;
  export function mkdir(
    path: string,
    options?: { recursive?: boolean },
  ): Promise<string | undefined>;
  export function rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
  export function copyFile(src: string, dest: string): Promise<void>;
  export function rename(src: string, dest: string): Promise<void>;
}

declare module 'node:path' {
  export const sep: string;
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(p: string): string;
  export function basename(p: string, ext?: string): string;
  export function extname(p: string): string;
  export function isAbsolute(p: string): boolean;
}

declare module 'node:child_process' {
  export interface SpawnOptions {
    cwd?: string;
    stdio?: 'inherit' | 'ignore' | 'pipe' | Array<string | number>;
    detached?: boolean;
    shell?: boolean;
    windowsHide?: boolean;
  }
  export interface ChildProcess {
    pid?: number;
    on(event: 'error', listener: (err: Error) => void): ChildProcess;
    on(
      event: 'close',
      listener: (code: number | null) => void,
    ): ChildProcess;
  }
  export function spawn(
    command: string,
    args: string[],
    options?: SpawnOptions,
  ): ChildProcess;
}
