/**
 * `nap assets`:应用图标 / 启动屏 / 主题颜色 → MAUI 宿主工程
 * (与 Capacitor 生态的 @capacitor/assets 工具对应,但采用 MAUI 原生的
 * Resizetizer 方案 —— 多平台位图由 dotnet build 在构建时自动生成:
 * https://learn.microsoft.com/dotnet/maui/user-interface/images/app-icons
 * https://learn.microsoft.com/dotnet/maui/user-interface/images/splashscreen)。
 *
 * 步骤:
 *  - 把源图(svg/png)拷入宿主 Resources/AppIcon 与 Resources/Splash
 *    (先移除同名旧文件,避免换格式后残留)
 *  - 改写宿主 csproj 的 <MauiIcon> / <MauiSplashScreen>(源图 + Color;
 *    未提供源图时仅更新 Color 属性)
 *  - 把主题颜色注入 Resources/Styles/Colors.xaml 与 Styles.xaml:
 *    napacitor:assets-begin/end 标记区块,幂等重写,区块外可自由追加
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { CLIConfig } from '../definitions';
import { fatal, runTask } from '../common';
import * as colors from '../colors';
import { pathExists, readTextFile, writeTextFile } from '../util/fs';
import { hostDirAbs, hostCsprojPath, requireHost } from './common';

/** 品牌色缺省值(MAUI 模板同款紫)。 */
export const DEFAULT_BRAND_COLOR = '#512BD4';

/** 源图支持的扩展名(Resizetizer 的矢量/位图两种形态)。 */
const IMAGE_EXTS = ['.svg', '.png'];

/** napacitor 颜色/样式注入区块标记(Colors.xaml 与 Styles.xaml 共用)。 */
const ASSETS_BLOCK_RE = /<!--\s*napacitor:assets-begin[\s\S]*?napacitor:assets-end\s*-->/;

/** `nap add maui` 的模板颜色令牌(与 assets 配置共享缺省值)。 */
export function assetTemplateTokens(config: CLIConfig): Record<string, string> {
  const a = config.assets;
  const iconColor = a?.iconColor ?? DEFAULT_BRAND_COLOR;
  const splashColor = a?.splashColor ?? DEFAULT_BRAND_COLOR;
  return {
    __ICON_COLOR__: iconColor,
    __SPLASH_COLOR__: splashColor,
    __PAGE_BACKGROUND_COLOR__: a?.colors?.['PageBackgroundColor'] ?? splashColor,
    __PRIMARY_TEXT_COLOR__: a?.colors?.['PrimaryTextColor'] ?? 'White',
  };
}

/** 解析后的资产生成计划(已合并缺省值)。 */
interface AssetPlan {
  /** 图标源文件绝对路径(未提供时为 null,保留现有图标)。 */
  iconSrc: string | null;
  /** 图标前景源文件绝对路径。 */
  iconForegroundSrc: string | null;
  /** 启动图源文件绝对路径。 */
  splashSrc: string | null;
  /** csproj 中 MauiIcon 的 Include 路径(仅提供源图时)。 */
  iconInclude: string | null;
  /** csproj 中 MauiIcon 的 ForegroundFile 路径。 */
  iconForegroundInclude: string | null;
  /** csproj 中 MauiSplashScreen 的 Include 路径。 */
  splashInclude: string | null;
  /** 启动图是否为矢量(svg 才写 BaseSize)。 */
  splashIsVector: boolean;
  iconColor: string;
  splashColor: string;
  splashBaseSize: string;
  /** 注入 Colors.xaml 的最终颜色(缺省 + 用户配置合并)。 */
  colors: Record<string, string>;
}

/** 执行资产生成:源图拷贝 + csproj 改写 + Colors/Styles 注入。 */
export async function generateAssets(config: CLIConfig): Promise<void> {
  await requireHost(config);
  const plan = await resolveAssetPlan(config);
  const hostDir = hostDirAbs(config);

  if (plan.iconSrc) {
    await runTask('图标 → Resources/AppIcon', async () => {
      await replaceAssetFile(
        plan.iconSrc!, path.join(hostDir, 'Resources', 'AppIcon'), 'appicon');
      if (plan.iconForegroundSrc) {
        await replaceAssetFile(
          plan.iconForegroundSrc!, path.join(hostDir, 'Resources', 'AppIcon'), 'appiconfg');
      }
    });
  }

  if (plan.splashSrc) {
    await runTask('启动屏 → Resources/Splash', async () => {
      await replaceAssetFile(
        plan.splashSrc!, path.join(hostDir, 'Resources', 'Splash'), 'splash');
    });
  }

  await runTask('更新 App.csproj(<MauiIcon> / <MauiSplashScreen>)', async () => {
    await patchCsproj(hostCsprojPath(config), plan);
  });

  await runTask('注入主题颜色(Colors.xaml / Styles.xaml)', async () => {
    const stylesDir = path.join(hostDir, 'Resources', 'Styles');
    await patchXaml(
      path.join(stylesDir, 'Colors.xaml'), renderColorsBlock(plan.colors));
    await patchXaml(
      path.join(stylesDir, 'Styles.xaml'), renderStylesBlock(plan.colors));
  });

  report(plan);
}

/** 解析配置 + 约定查找源图,合并颜色缺省值。 */
async function resolveAssetPlan(config: CLIConfig): Promise<AssetPlan> {
  const a = config.assets;
  if (!a) {
    fatal(
      'napacitor.config.json 缺少 assets 配置节 —— 请添加 ' +
      'assets { sourceDir / icon / splash / iconColor / colors … } 后重试');
  }
  const sourceDir = path.resolve(config.appDir, a.sourceDir);

  const iconSrc = await resolveAssetFile(
    sourceDir, a.icon, ['icon.svg', 'icon.png'], 'assets.icon');
  const iconForegroundSrc = await resolveAssetFile(
    sourceDir, a.iconForeground,
    ['icon-fg.svg', 'icon-fg.png', 'icon-foreground.svg', 'icon-foreground.png'],
    'assets.iconForeground');
  const splashSrc = await resolveAssetFile(
    sourceDir, a.splash, ['splash.svg', 'splash.png'], 'assets.splash');

  if (iconForegroundSrc !== null && iconSrc === null) {
    fatal('assets.iconForeground 需要与 assets.icon 同时提供(前景+背景模式)');
  }

  const splashColor = a.splashColor ?? DEFAULT_BRAND_COLOR;
  const iconColor = a.iconColor ?? DEFAULT_BRAND_COLOR;
  const colors: Record<string, string> = {
    // 页面背景与启动背景一致(启动→页面过渡不闪色),文本色缺省取反差白
    PageBackgroundColor: splashColor,
    PrimaryTextColor: 'White',
    ...(a.colors ?? {}),
  };

  return {
    iconSrc,
    iconForegroundSrc,
    splashSrc,
    iconInclude: iconSrc ? `Resources\\AppIcon\\appicon${extOf(iconSrc)}` : null,
    iconForegroundInclude: iconForegroundSrc
      ? `Resources\\AppIcon\\appiconfg${extOf(iconForegroundSrc)}`
      : null,
    splashInclude: splashSrc ? `Resources\\Splash\\splash${extOf(splashSrc)}` : null,
    splashIsVector: splashSrc !== null && extOf(splashSrc) === '.svg',
    iconColor,
    splashColor,
    splashBaseSize: a.splashBaseSize ?? '128,128',
    colors,
  };
}

/** 解析单个源文件:显式指定(不存在则 fatal)/ 约定候选名 / 都没有返回 null。 */
async function resolveAssetFile(
  sourceDir: string,
  explicit: string | undefined,
  candidates: string[],
  label: string,
): Promise<string | null> {
  if (explicit !== undefined) {
    const file = path.resolve(sourceDir, explicit);
    if (!(await pathExists(file))) {
      fatal(`napacitor.config.json 的 ${label} 指向的文件不存在:${file}`);
    }
    assertImageExt(file, label);
    return file;
  }
  for (const candidate of candidates) {
    const file = path.join(sourceDir, candidate);
    if (await pathExists(file)) {
      return file;
    }
  }
  return null;
}

function assertImageExt(file: string, label: string): void {
  if (!IMAGE_EXTS.includes(path.extname(file).toLowerCase())) {
    fatal(`${label} 仅支持 svg / png 源图,当前:${file}`);
  }
}

function extOf(file: string): string {
  return path.extname(file).toLowerCase();
}

/** 把源图拷入目标目录(先移除同名 base 的旧 svg/png,避免换格式后残留)。 */
async function replaceAssetFile(
  src: string,
  destDir: string,
  destBase: string,
): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  for (const ext of IMAGE_EXTS) {
    const stale = path.join(destDir, destBase + ext);
    if (await pathExists(stale)) {
      await fs.rm(stale, { force: true });
    }
  }
  await fs.copyFile(src, path.join(destDir, destBase + extOf(src)));
}

/** 改写 csproj 的 <MauiIcon> / <MauiSplashScreen>(无源图时仅更新 Color 属性)。 */
async function patchCsproj(csprojPath: string, plan: AssetPlan): Promise<void> {
  let text = await readTextFile(csprojPath);

  text = patchSelfClosingItem(text, /<MauiIcon\b[^>]*\/>/, (oldLine: string) => {
    if (!plan.iconInclude) {
      return withColorAttribute(oldLine, plan.iconColor);
    }
    let line = `<MauiIcon Include="${plan.iconInclude}"`;
    if (plan.iconForegroundInclude) {
      line += ` ForegroundFile="${plan.iconForegroundInclude}"`;
    }
    return `${line} Color="${plan.iconColor}" />`;
  }, csprojPath, '<MauiIcon>');

  text = patchSelfClosingItem(
    text, /<MauiSplashScreen\b[^>]*\/>/, (oldLine: string) => {
      if (!plan.splashInclude) {
        return withColorAttribute(oldLine, plan.splashColor);
      }
      let line =
        `<MauiSplashScreen Include="${plan.splashInclude}"` +
        ` Color="${plan.splashColor}"`;
      if (plan.splashIsVector) {
        line += ` BaseSize="${plan.splashBaseSize}"`;
      }
      return `${line} />`;
    }, csprojPath, '<MauiSplashScreen>');

  await writeTextFile(csprojPath, text);
}

/** 替换 csproj 中首个自闭合项;不存在时 fatal(宿主结构异常)。 */
function patchSelfClosingItem(
  text: string,
  re: RegExp,
  render: (oldLine: string) => string,
  file: string,
  label: string,
): string {
  const match = text.match(re);
  if (match === null) {
    fatal(`${file} 未找到 ${label} 声明 —— 无法接入资产,请检查宿主工程`);
  }
  return text.replace(re, () => render(match[0]));
}

/** 在自闭合项上替换/追加 Color 属性。 */
function withColorAttribute(line: string, colorValue: string): string {
  if (/\sColor="[^"]*"/.test(line)) {
    return line.replace(/\sColor="[^"]*"/, ` Color="${colorValue}"`);
  }
  return line.replace(/\s*\/>$/, ` Color="${colorValue}" />`);
}

/** 注入/重写 XAML 中的 napacitor:assets 区块(无区块时插到 </ResourceDictionary> 前)。 */
async function patchXaml(xamlPath: string, block: string): Promise<void> {
  if (!(await pathExists(xamlPath))) {
    fatal(`未找到 ${xamlPath} —— 宿主工程结构异常`);
  }
  let text = await readTextFile(xamlPath);
  if (ASSETS_BLOCK_RE.test(text)) {
    text = text.replace(ASSETS_BLOCK_RE, () => block);
  } else {
    const closeIdx = text.lastIndexOf('</ResourceDictionary>');
    if (closeIdx < 0) {
      fatal(`${xamlPath} 缺少 </ResourceDictionary> —— 无法注入 napacitor 资产区块`);
    }
    text = text.slice(0, closeIdx) + block + '\n' + text.slice(closeIdx);
  }
  await writeTextFile(xamlPath, text);
}

/** 渲染 Colors.xaml 注入区块(x:Key → 色值)。 */
function renderColorsBlock(colorMap: Record<string, string>): string {
  const lines = Object.entries(colorMap).map(
    ([key, value]) => `    <Color x:Key="${key}">${value}</Color>`);
  return [
    '    <!-- napacitor:assets-begin' +
    '(由 `nap assets` 依据 napacitor.config.json 生成/更新;区块外可自由追加) -->',
    ...lines,
    '    <!-- napacitor:assets-end -->',
  ].join('\n');
}

/**
 * 渲染 Styles.xaml 注入区块:依据已知语义色键生成基础样式
 * (PageBackgroundColor → ContentPage 背景;PrimaryTextColor → Label 文本色),
 * 其余自定义色仅注入 Colors.xaml,供用户 XAML 以 DynamicResource 引用。
 */
function renderStylesBlock(colorMap: Record<string, string>): string {
  const styles: string[] = [];
  if ('PageBackgroundColor' in colorMap) {
    styles.push(
      '    <Style TargetType="ContentPage" ApplyToDerivedTypes="True">',
      '        <Setter Property="BackgroundColor" Value="{DynamicResource PageBackgroundColor}" />',
      '    </Style>',
    );
  }
  if ('PrimaryTextColor' in colorMap) {
    styles.push(
      '    <Style TargetType="Label" ApplyToDerivedTypes="True">',
      '        <Setter Property="TextColor" Value="{DynamicResource PrimaryTextColor}" />',
      '    </Style>',
    );
  }
  return [
    '    <!-- napacitor:assets-begin' +
    '(由 `nap assets` 生成/更新;引用 Colors.xaml 的颜色资源) -->',
    ...styles,
    '    <!-- napacitor:assets-end -->',
  ].join('\n');
}

/** 输出执行报告。 */
function report(plan: AssetPlan): void {
  console.log(colors.success('\n✓ assets 完成:'));
  if (plan.iconSrc) {
    console.log(`  图标     ${plan.iconInclude}${plan.iconForegroundInclude ? ' + 前景' : ''}`);
  } else {
    console.log(colors.weak('  图标     未提供源图,保留现有图标(仅更新颜色)'));
  }
  if (plan.splashSrc) {
    console.log(`  启动屏   ${plan.splashInclude}`);
  } else {
    console.log(colors.weak('  启动屏   未提供源图,保留现有启动屏(仅更新颜色)'));
  }
  const colorList = Object.entries(plan.colors)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  console.log(`  颜色     ${colorList}`);
  console.log(colors.weak(
    '  下一步:nap build —— MAUI Resizetizer 将在构建时为各平台生成图标/启动屏位图'));
}
