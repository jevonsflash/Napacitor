/**
 * MAUI 平台公共助手(与 Capacitor CLI 的 android/common.ts 角色对应)。
 */
import * as path from 'node:path';
import type { CLIConfig } from '../definitions';
import { fatal } from '../common';
import { pathExists } from '../util/fs';

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
