/**
 * napacitor.config.json 的读取与校验(与 Capacitor CLI 的 config.ts 对应)。
 */
import * as path from 'node:path';
import type { AssetsConfig, CLIConfig, LoggingBehavior } from './definitions';
import { readJsonFile } from './util/fs';
import { fatal } from './common';

interface RawConfig {
  appId?: unknown;
  appName?: unknown;
  webDir?: unknown;
  loggingBehavior?: unknown;
  assets?: unknown;
  maui?: { hostDir?: unknown } | undefined;
  plugins?: unknown;
  [key: string]: unknown;
}

/** loggingBehavior 合法取值(语义同 Capacitor)。 */
const LOGGING_BEHAVIORS: readonly string[] = ['none', 'debug', 'production'];
/** XAML 颜色资源键:字母/数字/下划线,不以数字开头。 */
const COLOR_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** XAML 色值:#RGB/#RRGGBB/#AARRGGBB 或命名色。 */
const COLOR_VALUE_RE = /^#[0-9A-Fa-f]{3,8}$|^[A-Za-z][A-Za-z0-9]*$/;

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

  const loggingBehavior = parseLoggingBehavior(raw.loggingBehavior);
  const assets = parseAssets(raw.assets);

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
    loggingBehavior,
    assets,
    maui: { hostDir },
    plugins,
    raw: raw as Record<string, unknown>,
  };
}

/** 解析 loggingBehavior(缺省 debug,与 Capacitor 的默认值一致)。 */
function parseLoggingBehavior(value: unknown): LoggingBehavior {
  if (value === undefined || value === null) {
    return 'debug';
  }
  if (typeof value !== 'string' || !LOGGING_BEHAVIORS.includes(value)) {
    fatal(
      'napacitor.config.json 的 loggingBehavior 非法' +
      ' —— 可选值:none / debug / production');
  }
  return value as LoggingBehavior;
}

/** 解析并校验 assets 配置节(缺省返回 undefined)。 */
function parseAssets(value: unknown): AssetsConfig | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    fatal('napacitor.config.json 的 assets 配置节必须是对象');
  }
  const raw = value as Record<string, unknown>;

  const assigned: Partial<Record<keyof AssetsConfig, string>> = {};
  const stringFields: Array<[keyof AssetsConfig, string]> = [
    ['icon', 'assets.icon'],
    ['iconForeground', 'assets.iconForeground'],
    ['splash', 'assets.splash'],
    ['iconColor', 'assets.iconColor'],
    ['splashColor', 'assets.splashColor'],
    ['splashBaseSize', 'assets.splashBaseSize'],
  ];
  for (const [field, label] of stringFields) {
    const v = raw[field];
    if (v === undefined || v === null) {
      continue;
    }
    if (typeof v !== 'string' || v.trim() === '') {
      fatal(`napacitor.config.json 的 ${label} 必须是非空字符串`);
    }
    assigned[field] = v.trim();
  }

  const assets: AssetsConfig = {
    sourceDir:
      typeof raw.sourceDir === 'string' && raw.sourceDir.trim() !== ''
        ? raw.sourceDir.trim()
        : 'assets',
    icon: assigned['icon'],
    iconForeground: assigned['iconForeground'],
    splash: assigned['splash'],
    iconColor: assigned['iconColor'],
    splashColor: assigned['splashColor'],
    splashBaseSize: assigned['splashBaseSize'],
  };

  for (const field of ['iconColor', 'splashColor'] as const) {
    const v = assets[field];
    if (v !== undefined && !COLOR_VALUE_RE.test(v)) {
      fatal(
        `napacitor.config.json 的 assets.${field} 非法:"${v}"` +
        ' —— 应形如 #512BD4 或 White');
    }
  }

  const rawColors = raw.colors;
  if (rawColors !== undefined && rawColors !== null) {
    if (typeof rawColors !== 'object' || Array.isArray(rawColors)) {
      fatal('napacitor.config.json 的 assets.colors 必须是对象(XAML 资源键 → 色值)');
    }
    const colors: Record<string, string> = {};
    for (const [key, v] of Object.entries(rawColors as Record<string, unknown>)) {
      if (!COLOR_KEY_RE.test(key)) {
        fatal(
          `napacitor.config.json 的 assets.colors 键 "${key}" 非法` +
          ' —— 应为合法 XAML 资源键(字母开头,仅字母/数字/下划线)');
      }
      if (typeof v !== 'string' || !COLOR_VALUE_RE.test(v.trim())) {
        fatal(
          `napacitor.config.json 的 assets.colors["${key}"] 非法:"${v}"` +
          ' —— 应形如 #512BD4 或 White');
      }
      colors[key] = v.trim();
    }
    assets.colors = colors;
  }

  return assets;
}
