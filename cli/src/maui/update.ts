/**
 * `nap sync` 的 update 半边:生成 napacitor.build.props 与
 * napacitor.pluginrefs.g.cs(与 Capacitor 生成 capacitor.settings.gradle /
 * capacitor.build.gradle 对应)。
 *
 * 读取应用 package.json 中全部 @napacitor/* 依赖(排除 cli/core,二者无 C# 工程),
 * 为每个包含 maui/*.csproj 的包生成 ProjectReference;运行时引用恒在。
 *
 * 同时扫描各插件的 [NapacitorPlugin] 入口类型,生成编译期引用锚:宿主代码
 * 不直接使用插件类型时,即使有 ProjectReference,编译器也不会把对插件
 * 程序集的引用写入 App.dll 元数据 —— Android(程序集内嵌 APK、按需惰性
 * 加载)上运行时的引用链插件发现会因此找不到插件,引用锚用 typeof 显式
 * "钉住"每个插件程序集的引用(锚类型不参与任何运行时逻辑)。
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { CLIConfig } from '../definitions';
import { fatal, runTask } from '../common';
import * as colors from '../colors';
import { pathExists, readJsonFile, readTextFile, writeTextFile } from '../util/fs';
import { hostDirAbs, requireHost } from './common';

const NAPACITOR_SCOPE = '@napacitor/';
/** 这些包没有 C# 工程,不参与 ProjectReference 生成。 */
const NO_CS_PROJ_PACKAGES = ['@napacitor/cli', '@napacitor/core'];
/** 编译期引用锚文件名(与 napacitor.build.props 同目录、同步生成)。 */
const PLUGINREFS_FILENAME = 'napacitor.pluginrefs.g.cs';

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** 生成的引用描述(供输出报告与渲染 props / 引用锚)。 */
export interface PluginRef {
  /** npm 包名,如 @napacitor/device。 */
  name: string;
  /** csproj 相对宿主目录的 MSBuild Include 路径。 */
  include: string;
  /** 包内 [NapacitorPlugin] 入口类型全名(运行时引用恒在,无需锚定)。 */
  pluginTypes: string[];
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
  await runTask(
    `生成 napacitor.build.props / ${PLUGINREFS_FILENAME}`,
    async () => {
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
        pluginTypes: [],
      });

      for (const name of pluginNames) {
        const shortName = name.slice(NAPACITOR_SCOPE.length);
        const csproj = await findPluginCsproj(
          path.join(nodeModules, '@napacitor', shortName));
        if (csproj === null) {
          console.log(colors.weak(`  跳过 ${name}(包内未找到 maui/*.csproj)`));
          continue;
        }
        const pluginTypes = await scanPluginTypes(csproj);
        if (pluginTypes.length === 0) {
          console.log(colors.weak(
            `  警告:${name} 内未找到 [NapacitorPlugin] 入口类型,` +
            '不会为其生成引用锚(该插件在 Android 上可能无法被发现)'));
        }
        refs.push({
          name,
          include: path.relative(hostDir, csproj),
          pluginTypes,
        });
      }

      await writeTextFile(
        path.join(hostDir, 'napacitor.build.props'),
        renderBuildProps(refs),
      );
      await writeTextFile(
        path.join(hostDir, PLUGINREFS_FILENAME),
        renderPluginRefsCs(refs),
      );
    });

  console.log(colors.strong(`  接入的 Napacitor 工程(${refs.length}):`));
  for (const ref of refs) {
    console.log(`    ${ref.name} ${colors.weak(ref.include)}`);
  }
  const anchored = refs.reduce((count, ref) => count + ref.pluginTypes.length, 0);
  console.log(colors.weak(
    `  引用锚定插件入口类型(${anchored}):${PLUGINREFS_FILENAME}`));
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

/**
 * 扫描插件 maui/*.cs 源码,提取 [NapacitorPlugin] 标注的入口类全名。
 * (轻量正则而非完整语法树:插件约定单一命名空间、特性紧邻类声明;
 * typeof 生成后由编译器校验,提取错误会在宿主编译期立即暴露。)
 */
async function scanPluginTypes(csprojPath: string): Promise<string[]> {
  const dir = path.dirname(csprojPath);
  const files = (await fs.readdir(dir))
    .filter((name) => name.toLowerCase().endsWith('.cs'))
    .sort();

  const types: string[] = [];
  for (const file of files) {
    const source = await readTextFile(path.join(dir, file));
    const ns = source.match(/(?:^|\n)\s*namespace\s+([A-Za-z_][\w.]*)/);
    if (ns === null) {
      continue; // 无命名空间的源文件不参与(插件约定均含命名空间)
    }
    const classRe =
      /\[NapacitorPlugin[^\]]*\][\s\S]{0,160}?\bclass\s+([A-Za-z_]\w*)/g;
    let match: RegExpExecArray | null;
    while ((match = classRe.exec(source)) !== null) {
      types.push(`${ns[1]}.${match[1]}`);
    }
  }
  return types;
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

/** 渲染编译期引用锚源文件(typeof 每个插件入口类型)。 */
function renderPluginRefsCs(refs: PluginRef[]): string {
  const typeLines = refs
    .flatMap((ref) => ref.pluginTypes)
    .sort()
    .map((type) => `        typeof(global::${type}),`);
  const arrayDecl = typeLines.length > 0
    ? [
        '    internal static readonly System.Type[] PluginTypes =',
        '    {',
        ...typeLines,
        '    };',
      ].join('\n')
    : '    internal static readonly System.Type[] PluginTypes = { };';
  return [
    '// <auto-generated>由 `nap sync` 自动生成/更新(勿手动编辑)。',
    '// 编译期引用锚点:宿主代码不直接使用插件类型时,即使 napacitor.build.props',
    '// 里有 ProjectReference,编译器也不会把对插件程序集的引用写入 App.dll 的',
    '// 元数据。本文件用 typeof 显式"钉住"每个插件程序集的引用,使运行时',
    '// PluginRegistry 的引用链插件发现在所有平台可用(Android 的程序集内嵌',
    '// 进 APK、按需惰性加载,尤其依赖此引用链)。',
    '// 本类型不参与任何运行时逻辑,类型初始化器永不被触发。',
    'namespace Napacitor.Generated;',
    '',
    'internal static class NapacitorPluginRoots',
    '{',
    arrayDecl,
    '}',
    '',
  ].join('\n');
}
