/**
 * MAUI 平台公共助手(与 Capacitor CLI 的 android/common.ts 角色对应)。
 */
import * as path from 'node:path';
import type { CLIConfig } from '../definitions';
import { fatal } from '../common';
import { pathExists, readTextFile } from '../util/fs';

/** 唯一支持的平台名。 */
export const PLATFORM_NAME = 'maui';

/** 宿主工程目录(绝对路径)。 */
export function hostDirAbs(config: CLIConfig): string {
  return path.resolve(config.appDir, config.maui.hostDir);
}

/** 宿主 wwwroot 目录(绝对路径)。 */
export function wwwrootDirAbs(config: CLIConfig): string {
  return path.join(hostDirAbs(config), 'wwwroot');
}

/** 宿主工程文件(绝对路径)。 */
export function hostCsprojPath(config: CLIConfig): string {
  return path.join(hostDirAbs(config), 'App.csproj');
}

/** 断言宿主工程已添加(未 add 时给出提示)。 */
export async function requireHost(config: CLIConfig): Promise<void> {
  if (!(await pathExists(hostCsprojPath(config)))) {
    fatal(
      `未找到宿主工程 ${hostCsprojPath(config)} —— 请先运行 "nap add ${PLATFORM_NAME}"`);
  }
}

/** 目标平台 → 宿主 csproj 中的 TargetFramework 前缀。 */
export const TARGET_TFM_PREFIXES: Record<string, string> = {
  windows: 'net10.0-windows',
  android: 'net10.0-android',
  ios: 'net10.0-ios',
  maccatalyst: 'net10.0-maccatalyst',
};

/** 解析目标平台:显式指定优先;缺省 Windows 上取 windows,其余取 android。 */
export function resolveTarget(target: string | undefined): string {
  const resolved = target ?? (process.platform === 'win32' ? 'windows' : 'android');
  if (TARGET_TFM_PREFIXES[resolved] === undefined) {
    fatal(`未知目标 "${resolved}" —— 支持:${Object.keys(TARGET_TFM_PREFIXES).join(' / ')}`);
  }
  return resolved;
}

/** 解析目标平台对应的宿主 TargetFramework(build / clean / run 共用);宿主未声明对应 TFM 时 fatal。 */
export async function resolveTargetTfm(
  csproj: string,
  target: string | undefined,
): Promise<{ target: string; tfm: string }> {
  const resolved = resolveTarget(target);
  const prefix = TARGET_TFM_PREFIXES[resolved];
  const tfm = await resolveTfm(csproj, prefix);
  if (tfm === null) {
    fatal(`宿主工程未声明以 "${prefix}" 开头的 TargetFramework`);
  }
  return { target: resolved, tfm };
}

/**
 * 从宿主 csproj 静态解析以 prefix 开头的 TargetFramework。
 * 收集全部 <TargetFrameworks> 声明,含条件追加元素(模板在 Windows 上追加
 * net10.0-windows10.0.19041.0);MSBuild 属性引用($(...))无法静态求值,跳过。
 * (条件是否成立由 dotnet build 自行评估,CLI 只需选出 -f 参数)
 */
async function resolveTfm(
  csproj: string,
  prefix: string,
): Promise<string | null> {
  const text = await readTextFile(csproj);
  const tfms: string[] = [];
  const re = /<TargetFrameworks?[^>]*>([^<]*)<\/TargetFrameworks?>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    for (const raw of match[1].split(';')) {
      const tfm = raw.trim();
      if (tfm.length > 0 && !tfm.includes('$(') && !tfms.includes(tfm)) {
        tfms.push(tfm);
      }
    }
  }
  // windows 目标的 TFM 形如 net10.0-windows10.0.19041.0(-windows 后直接跟版本号)
  return tfms.find((tfm) => tfm.startsWith(prefix)) ?? null;
}

/**
 * 定位 maui-template 模板目录:随 @napacitor/cli 包分发的 assets/maui-template
 * (npm 安装布局,与 Capacitor 把平台模板归档内置于 cli 包 assets 的做法一致)。
 */
export async function resolveTemplateDir(): Promise<string> {
  // 本文件编译后位于 <包根>/dist/maui/,上跳两级即包根(node_modules/@napacitor/cli)
  const cliRoot = path.resolve(__dirname, '..', '..');
  const packaged = path.join(cliRoot, 'assets', 'maui-template');
  if (await pathExists(packaged)) {
    return packaged;
  }
  fatal(
    `maui 模板 assets 缺失:${packaged}` +
    ' —— @napacitor/cli 包安装不完整,请重新安装后重试');
}
