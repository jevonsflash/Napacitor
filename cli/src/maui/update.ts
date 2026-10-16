/**
 * `nap sync` 的 update 半边:生成 napacitor.build.props
 * (与 Capacitor 生成 capacitor.settings.gradle / capacitor.build.gradle 对应)。
 *
 * 读取应用 package.json 中全部 @napacitor/* 依赖(排除 cli/core,二者无 C# 工程),
 * 为每个包含 maui/*.csproj 的包生成 ProjectReference;运行时引用恒在。
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { CLIConfig } from '../definitions';
import { fatal, runTask } from '../common';
import * as colors from '../colors';
import { pathExists, readJsonFile, writeTextFile } from '../util/fs';
import { hostDirAbs, requireHost } from './common';

const NAPACITOR_SCOPE = '@napacitor/';
/** 这些包没有 C# 工程,不参与 ProjectReference 生成。 */
const NO_CS_PROJ_PACKAGES = ['@napacitor/cli', '@napacitor/core'];

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** 生成的引用描述(供输出报告与渲染 props)。 */
export interface PluginRef {
  /** npm 包名,如 @napacitor/device。 */
  name: string;
  /** csproj 相对宿主目录的 MSBuild Include 路径。 */
  include: string;
}

export async function updateMaui(config: CLIConfig): Promise<void> {
  await requireHost(config);

  const pkgPath = path.join(config.appDir, 'package.json');
  const pkg = await readJsonFile<PackageJsonShape>(pkgPath);
  if (pkg === null) {
    fatal(`未找到 ${pkgPath} —— 请先在应用目录执行 npm init 并安装 @napacitor/* 包`);
  }

  const deps: Record<string, string> = {
    ...(pkg.devDependencies ?? {}),
    ...(pkg.dependencies ?? {}),
  };
  const pluginNames = Object.keys(deps)
    .filter((name) => name.startsWith(NAPACITOR_SCOPE))
    .filter((name) => !NO_CS_PROJ_PACKAGES.includes(name))
    .filter((name) => name !== '@napacitor/maui') // 运行时引用恒在,单列
    .sort();

  const hostDir = hostDirAbs(config);
  const nodeModules = path.join(config.appDir, 'node_modules');

  const refs: PluginRef[] = [];
  await runTask('生成 napacitor.build.props', async () => {
    // 运行时引用恒在(对应 Capacitor 模板对 capacitor-android 的固定引用)
    const runtimeCsproj = path.join(
      nodeModules, '@napacitor', 'maui', 'src', 'Napacitor.csproj');
    if (!(await pathExists(runtimeCsproj))) {
      fatal(
        `未找到 ${runtimeCsproj} —— 请安装运行时包:npm install @napacitor/maui`);
    }
    refs.push({
      name: '@napacitor/maui',
      include: path.relative(hostDir, runtimeCsproj),
    });

    for (const name of pluginNames) {
      const shortName = name.slice(NAPACITOR_SCOPE.length);
      const csproj = await findPluginCsproj(
        path.join(nodeModules, '@napacitor', shortName));
      if (csproj === null) {
        console.log(colors.weak(`  跳过 ${name}(包内未找到 maui/*.csproj)`));
        continue;
      }
      refs.push({ name, include: path.relative(hostDir, csproj) });
    }

    await writeTextFile(
      path.join(hostDir, 'napacitor.build.props'),
      renderBuildProps(refs),
    );
  });

  console.log(colors.strong(`  接入的 Napacitor 工程(${refs.length}):`));
  for (const ref of refs) {
    console.log(`    ${ref.name} ${colors.weak(ref.include)}`);
  }
}

/** 在插件包根目录下定位 maui/*.csproj(取排序后的第一个)。 */
async function findPluginCsproj(packageDir: string): Promise<string | null> {
  const mauiDir = path.join(packageDir, 'maui');
  if (!(await pathExists(mauiDir))) {
    return null;
  }
  const entries = (await fs.readdir(mauiDir))
    .filter((name) => name.toLowerCase().endsWith('.csproj'))
    .sort();
  if (entries.length === 0) {
    return null;
  }
  return path.join(mauiDir, entries[0]);
}

function renderBuildProps(refs: PluginRef[]): string {
  const lines = refs.map(
    (ref) => `    <ProjectReference Include="${ref.include}" />`);
  return [
    '<Project>',
    '  <!--',
    '    napacitor.build.props —— 由 `nap sync` 自动生成/更新(勿手动编辑)。',
    '    作用与 Capacitor Android 的 capacitor.settings.gradle / capacitor.build.gradle 对应:',
    '    把应用依赖的每个 @napacitor/* npm 包内的 C# 工程(及 Napacitor 运行时)接入宿主编译。',
    '  -->',
    '  <ItemGroup>',
    ...lines,
    '  </ItemGroup>',
    '</Project>',
    '',
  ].join('\n');
}
