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
exports.initCommand = initCommand;
/**
 * `nap init`:初始化应用,写入 napacitor.config.json
 * (与 Capacitor CLI 的 tasks/init.ts 对应;非交互,参数缺失时用默认值)。
 */
const path = __importStar(require("node:path"));
const colors = __importStar(require("../colors"));
const fs_1 = require("../util/fs");
const common_1 = require("../common");
async function initCommand(appDir, args, options) {
    var _a, _b, _c;
    const appId = (_a = args[0]) !== null && _a !== void 0 ? _a : 'com.napacitor.app';
    const appName = (_b = args[1]) !== null && _b !== void 0 ? _b : path.basename(appDir);
    const webDir = (_c = options['web-dir']) !== null && _c !== void 0 ? _c : 'dist';
    const configPath = path.join(appDir, 'napacitor.config.json');
    if (await (0, fs_1.pathExists)(configPath)) {
        (0, common_1.fatal)(`${configPath} 已存在 —— 如需重新初始化请先删除该文件`);
    }
    const config = {
        appId,
        appName,
        webDir,
        maui: { hostDir: 'maui' },
    };
    await (0, fs_1.writeTextFile)(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(colors.success(`✓ 已写入 ${configPath}`));
    console.log(`  appId    = ${colors.strong(appId)}`);
    console.log(`  appName  = ${colors.strong(appName)}`);
    console.log(`  webDir   = ${colors.strong(webDir)}`);
    console.log(`\n下一步(与 Capacitor 工作流同形):\n` +
        `  1. npm install @napacitor/core @napacitor/maui @napacitor/cli --save-dev\n` +
        `  2. npm install @napacitor/device            # 按需安装插件\n` +
        `  3. 构建 Web 应用(产物输出到 ${webDir}/)\n` +
        `  4. nap add maui && nap sync && nap run`);
}
