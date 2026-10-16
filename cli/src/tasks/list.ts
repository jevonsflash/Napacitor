/**
 * `nap list`:列出应用已安装的 @napacitor/* 包
 * (与 Capacitor CLI 的 tasks/list.ts 对应)。
 */
import * as path from 'node:path';
import * as colors from '../colors';
import { readJsonFile } from '../util/fs';

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function listCommand(appDir: string): Promise<void> {
  const pkg = await readJsonFile<PackageJsonShape>(
    path.join(appDir, 'package.json'));
  if (pkg === null) {
    console.log(colors.weak(`未找到 ${path.join(appDir, 'package.json')}`));
    return;
  }

  const deps: Record<string, string> = {
    ...(pkg.devDependencies ?? {}),
    ...(pkg.dependencies ?? {}),
  };
  const napacitorPkgs = Object.keys(deps)
    .filter((name) => name.startsWith('@napacitor/'))
    .sort();

  if (napacitorPkgs.length === 0) {
    console.log('尚未安装任何 @napacitor/* 包');
    return;
  }

  console.log(`已安装的 Napacitor 包(${napacitorPkgs.length}):`);
  for (const name of napacitorPkgs) {
    console.log(`  ${colors.strong(name)} ${colors.weak(deps[name])}`);
  }
}
