/**
 * @napacitor/cli 入口(与 Capacitor CLI 的 index.ts 对应):
 * 命令分发 + help + 轻量 argv 解析(零依赖,替代 minimist)。
 */
import type { ParsedArgs } from './definitions';
import { loadConfig } from './config';
import { fatal } from './common';
import * as colors from './colors';
import { PLATFORM_NAME } from './maui/common';
import { initCommand } from './tasks/init';
import { addCommand } from './tasks/add';
import { copyCommand } from './tasks/copy';
import { syncCommand } from './tasks/sync';
import { openCommand } from './tasks/open';
import { runTaskCommand } from './tasks/run';
import { listCommand } from './tasks/list';

const VERSION = '0.1.0';

const HELP = `Napacitor CLI —— 复刻 Capacitor 的跨平台运行时 CLI(原生层为 .NET MAUI Blazor)

用法:nap <命令> [参数]

命令:
  init [appId] [appName] [--web-dir <dir>]   初始化应用,写入 napacitor.config.json
  add <maui>                                  从内置模板生成 MAUI 宿主工程
  copy [maui]                                 复制 Web 构建产物到宿主 wwwroot 并宿主化改造
  sync [maui]                                 copy + 重新生成 napacitor.build.props
  open <maui>                                 用系统默认方式打开宿主工程
  run [maui] [--target <t>] [-c <cfg>]        构建并运行宿主(dotnet build -t:Run)
  list                                        列出应用已安装的 @napacitor/* 包
  help                                        显示本帮助

选项:
  --target <windows|android|ios|maccatalyst>  nap run 的目标平台(Windows 默认 windows)
  -c <Debug|Release>                          nap run 的构建配置(默认 Debug)

示例(与 Capacitor 工作流同形):
  nap init com.example.app "My App" --web-dir dist
  npm install @napacitor/core @napacitor/maui @napacitor/device
  nap add maui
  nap sync
  nap run --target windows`;

/** 解析 argv:位置参数与 --key value / -k value 选项(替代 minimist)。 */
export function parseArgs(argv: string[]): ParsedArgs {
  const args: string[] = [];
  const options: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        options[key] = next;
        i++;
      } else {
        options[key] = 'true';
      }
    } else if (token.startsWith('-') && token.length === 2) {
      const key = token.slice(1);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        options[key] = next;
        i++;
      } else {
        options[key] = 'true';
      }
    } else {
      args.push(token);
    }
  }
  return { args, options };
}

/** 校验平台位置参数(仅支持 maui;缺省取 maui)。 */
function resolvePlatform(args: string[]): string {
  const platform = args[0] ?? PLATFORM_NAME;
  if (platform !== PLATFORM_NAME) {
    fatal(`不支持的平台 "${platform}" —— Napacitor 目前仅支持 ${PLATFORM_NAME}`);
  }
  return platform;
}

/** 命令分发(run 仅供 bin 调用;导出便于测试)。 */
export async function run(argv: string[]): Promise<void> {
  const command = argv[0];
  const { args, options } = parseArgs(argv.slice(1));

  switch (command) {
    case 'init':
      await initCommand(process.cwd(), args, options);
      break;

    case 'add':
      resolvePlatform(args);
      await addCommand(await loadConfig(process.cwd()));
      break;

    case 'copy':
      resolvePlatform(args);
      await copyCommand(await loadConfig(process.cwd()));
      break;

    case 'sync':
      resolvePlatform(args);
      await syncCommand(await loadConfig(process.cwd()));
      break;

    case 'open':
      resolvePlatform(args);
      await openCommand(await loadConfig(process.cwd()));
      break;

    case 'run':
      resolvePlatform(args);
      await runTaskCommand(await loadConfig(process.cwd()), {
        target: options['target'],
        configuration: options['c'],
      });
      break;

    case 'list':
      await listCommand(process.cwd());
      break;

    case 'help':
    case '--help':
    case '-h':
    case undefined:
      console.log(HELP);
      break;

    default:
      fatal(`未知命令 "${command}" —— 运行 nap help 查看用法`);
  }
}

/** bin 入口:捕获未处理异常并红字退出。 */
export async function main(): Promise<void> {
  console.log(colors.weak(`\nNapacitor CLI ${VERSION}\n`));
  try {
    await run(process.argv.slice(2));
  } catch (err) {
    fatal(err instanceof Error ? err.message : String(err));
  }
}
