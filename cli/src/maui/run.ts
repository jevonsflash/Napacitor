/**
 * `nap run maui`:构建并运行宿主工程(与 Capacitor CLI 的 run.ts 对应)。
 * 底层执行 `dotnet build <宿主> -t:Run -f <TFM> -c <Debug|Release>`。
 */
import type { CLIConfig, RunOptions } from '../definitions';
import { fatal, runTask } from '../common';
import { readTextFile } from '../util/fs';
import { runCommand } from '../util/subprocess';
import { hostCsprojPath, requireHost } from './common';

/** 目标平台 → 宿主 csproj 中的 TargetFramework 前缀。 */
const TARGET_TFM_PREFIXES: Record<string, string> = {
  windows: 'net10.0-windows',
  android: 'net10.0-android',
  ios: 'net10.0-ios',
  maccatalyst: 'net10.0-maccatalyst',
};

export async function runMaui(
  config: CLIConfig,
  options: RunOptions,
): Promise<void> {
  await requireHost(config);

  const target =
    options.target ?? (process.platform === 'win32' ? 'windows' : 'android');
  const prefix = TARGET_TFM_PREFIXES[target];
  if (prefix === undefined) {
    fatal(`未知目标 "${target}" —— 支持:${Object.keys(TARGET_TFM_PREFIXES).join(' / ')}`);
  }

  const csproj = hostCsprojPath(config);
  const tfm = await resolveTfm(csproj, prefix);
  if (tfm === null) {
    fatal(`宿主工程未声明以 "${prefix}" 开头的 TargetFramework`);
  }
  const configuration = options.configuration ?? 'Debug';

  await runTask(
    `构建并运行(target: ${target},TFM: ${tfm},配置: ${configuration})`,
    async () => {
      await runCommand('dotnet', [
        'build', csproj, '-t:Run', '-f', tfm, '-c', configuration,
      ]);
    },
  );
}

/**
 * 从宿主 csproj 解析以 prefix 开头的 TargetFramework。
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
