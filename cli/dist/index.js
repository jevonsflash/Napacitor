"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
exports.run = run;
exports.main = main;
const config_1 = require("./config");
const common_1 = require("./common");
const colors = __importStar(require("./colors"));
const common_2 = require("./maui/common");
const init_1 = require("./tasks/init");
const add_1 = require("./tasks/add");
const copy_1 = require("./tasks/copy");
const sync_1 = require("./tasks/sync");
const open_1 = require("./tasks/open");
const run_1 = require("./tasks/run");
const list_1 = require("./tasks/list");
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
function parseArgs(argv) {
    const args = [];
    const options = {};
    for (let i = 0; i < argv.length; i++) {
        const token = argv[i];
        if (token.startsWith('--')) {
            const key = token.slice(2);
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('-')) {
                options[key] = next;
                i++;
            }
            else {
                options[key] = 'true';
            }
        }
        else if (token.startsWith('-') && token.length === 2) {
            const key = token.slice(1);
            const next = argv[i + 1];
            if (next !== undefined && !next.startsWith('-')) {
                options[key] = next;
                i++;
            }
            else {
                options[key] = 'true';
            }
        }
        else {
            args.push(token);
        }
    }
    return { args, options };
}
/** 校验平台位置参数(仅支持 maui;缺省取 maui)。 */
function resolvePlatform(args) {
    var _a;
    const platform = (_a = args[0]) !== null && _a !== void 0 ? _a : common_2.PLATFORM_NAME;
    if (platform !== common_2.PLATFORM_NAME) {
        (0, common_1.fatal)(`不支持的平台 "${platform}" —— Napacitor 目前仅支持 ${common_2.PLATFORM_NAME}`);
    }
    return platform;
}
/** 命令分发(run 仅供 bin 调用;导出便于测试)。 */
async function run(argv) {
    const command = argv[0];
    const { args, options } = parseArgs(argv.slice(1));
    switch (command) {
        case 'init':
            await (0, init_1.initCommand)(process.cwd(), args, options);
            break;
        case 'add':
            resolvePlatform(args);
            await (0, add_1.addCommand)(await (0, config_1.loadConfig)(process.cwd()));
            break;
        case 'copy':
            resolvePlatform(args);
            await (0, copy_1.copyCommand)(await (0, config_1.loadConfig)(process.cwd()));
            break;
        case 'sync':
            resolvePlatform(args);
            await (0, sync_1.syncCommand)(await (0, config_1.loadConfig)(process.cwd()));
            break;
        case 'open':
            resolvePlatform(args);
            await (0, open_1.openCommand)(await (0, config_1.loadConfig)(process.cwd()));
            break;
        case 'run':
            resolvePlatform(args);
            await (0, run_1.runTaskCommand)(await (0, config_1.loadConfig)(process.cwd()), {
                target: options['target'],
                configuration: options['c'],
            });
            break;
        case 'list':
            await (0, list_1.listCommand)(process.cwd());
            break;
        case 'help':
        case '--help':
        case '-h':
        case undefined:
            console.log(HELP);
            break;
        default:
            (0, common_1.fatal)(`未知命令 "${command}" —— 运行 nap help 查看用法`);
    }
}
/** bin 入口:捕获未处理异常并红字退出。 */
async function main() {
    console.log(colors.weak(`\nNapacitor CLI ${VERSION}\n`));
    try {
        await run(process.argv.slice(2));
    }
    catch (err) {
        (0, common_1.fatal)(err instanceof Error ? err.message : String(err));
    }
}
