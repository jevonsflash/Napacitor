"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMaui = runMaui;
const common_1 = require("../common");
const fs_1 = require("../util/fs");
const subprocess_1 = require("../util/subprocess");
const common_2 = require("./common");
/** 目标平台 → 宿主 csproj 中的 TargetFramework 前缀。 */
const TARGET_TFM_PREFIXES = {
    windows: 'net10.0-windows',
    android: 'net10.0-android',
    ios: 'net10.0-ios',
    maccatalyst: 'net10.0-maccatalyst',
};
async function runMaui(config, options) {
    var _a, _b;
    await (0, common_2.requireHost)(config);
    const target = (_a = options.target) !== null && _a !== void 0 ? _a : (process.platform === 'win32' ? 'windows' : 'android');
    const prefix = TARGET_TFM_PREFIXES[target];
    if (prefix === undefined) {
        (0, common_1.fatal)(`未知目标 "${target}" —— 支持:${Object.keys(TARGET_TFM_PREFIXES).join(' / ')}`);
    }
    const csproj = (0, common_2.hostCsprojPath)(config);
    const tfm = await resolveTfm(csproj, prefix);
    if (tfm === null) {
        (0, common_1.fatal)(`宿主工程未声明以 "${prefix}" 开头的 TargetFramework`);
    }
    const configuration = (_b = options.configuration) !== null && _b !== void 0 ? _b : 'Debug';
    await (0, common_1.runTask)(`构建并运行(target: ${target},TFM: ${tfm},配置: ${configuration})`, async () => {
        await (0, subprocess_1.runCommand)('dotnet', [
            'build', csproj, '-t:Run', '-f', tfm, '-c', configuration,
        ]);
    });
}
/**
 * 从宿主 csproj 解析以 prefix 开头的 TargetFramework。
 * 收集全部 <TargetFrameworks> 声明,含条件追加元素(模板在 Windows 上追加
 * net10.0-windows10.0.19041.0);MSBuild 属性引用($(...))无法静态求值,跳过。
 * (条件是否成立由 dotnet build 自行评估,CLI 只需选出 -f 参数)
 */
async function resolveTfm(csproj, prefix) {
    var _a;
    const text = await (0, fs_1.readTextFile)(csproj);
    const tfms = [];
    const re = /<TargetFrameworks?[^>]*>([^<]*)<\/TargetFrameworks?>/g;
    let match;
    while ((match = re.exec(text)) !== null) {
        for (const raw of match[1].split(';')) {
            const tfm = raw.trim();
            if (tfm.length > 0 && !tfm.includes('$(') && !tfms.includes(tfm)) {
                tfms.push(tfm);
            }
        }
    }
    // windows 目标的 TFM 形如 net10.0-windows10.0.19041.0(-windows 后直接跟版本号)
    return (_a = tfms.find((tfm) => tfm.startsWith(prefix))) !== null && _a !== void 0 ? _a : null;
}
