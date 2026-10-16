/**
 * napacitor.config.json 的读取与校验(与 Capacitor CLI 的 config.ts 对应)。
 */
import * as path from 'node:path';
import type { CLIConfig } from './definitions';
import { readJsonFile } from './util/fs';
import { fatal } from './common';

interface RawConfig {
  appId?: unknown;
  appName?: unknown;
  webDir?: unknown;
  maui?: { hostDir?: unknown } | undefined;
  plugins?: unknown;
  [key: string]: unknown;
}

/**
 * 加载并校验 napacitor.config.json。
 * 文件缺失或必填字段(appId / appName / webDir)非法时终止 CLI。
 */
export async function loadConfig(appDir: string): Promise<CLIConfig> {
  const configPath = path.join(appDir, 'napacitor.config.json');
  const raw = (await readJsonFile<RawConfig>(configPath)) as RawConfig | null;
  if (raw === null) {
    fatal(`未找到 ${configPath} —— 请先在应用目录运行 "nap init" 初始化`);
  }

  const appId = typeof raw.appId === 'string' ? raw.appId.trim() : '';
  const appName = typeof raw.appName === 'string' ? raw.appName.trim() : '';
  const webDir = typeof raw.webDir === 'string' ? raw.webDir.trim() : '';
  if (!appId || !appName || !webDir) {
    fatal(
      'napacitor.config.json 缺少必填字段:appId / appName / webDir 均为非空字符串');
  }

  const hostDir =
    raw.maui &&
    typeof raw.maui === 'object' &&
    typeof raw.maui.hostDir === 'string'
      ? raw.maui.hostDir
      : 'maui';

  const plugins =
    raw.plugins && typeof raw.plugins === 'object'
      ? (raw.plugins as Record<string, Record<string, unknown>>)
      : {};

  return {
    appDir,
    appId,
    appName,
    webDir,
    maui: { hostDir },
    plugins,
    raw: raw as Record<string, unknown>,
  };
}
