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
exports.PLATFORM_NAME = void 0;
exports.hostDirAbs = hostDirAbs;
exports.wwwrootDirAbs = wwwrootDirAbs;
exports.hostCsprojPath = hostCsprojPath;
exports.requireHost = requireHost;
exports.resolveTemplateDir = resolveTemplateDir;
/**
 * MAUI 平台公共助手(与 Capacitor CLI 的 android/common.ts 角色对应)。
 */
const path = __importStar(require("node:path"));
const common_1 = require("../common");
const fs_1 = require("../util/fs");
/** 唯一支持的平台名。 */
exports.PLATFORM_NAME = 'maui';
/** 宿主工程目录(绝对路径)。 */
function hostDirAbs(config) {
    return path.resolve(config.appDir, config.maui.hostDir);
}
/** 宿主 wwwroot 目录(绝对路径)。 */
function wwwrootDirAbs(config) {
    return path.join(hostDirAbs(config), 'wwwroot');
}
/** 宿主工程文件(绝对路径)。 */
function hostCsprojPath(config) {
    return path.join(hostDirAbs(config), 'App.csproj');
}
/** 断言宿主工程已添加(未 add 时给出提示)。 */
async function requireHost(config) {
    if (!(await (0, fs_1.pathExists)(hostCsprojPath(config)))) {
        (0, common_1.fatal)(`未找到宿主工程 ${hostCsprojPath(config)} —— 请先运行 "nap add ${exports.PLATFORM_NAME}"`);
    }
}
/**
 * 定位 maui-template 模板目录:随 @napacitor/cli 包分发的 assets/maui-template
 * (npm 安装布局,与 Capacitor 把平台模板归档内置于 cli 包 assets 的做法一致)。
 */
async function resolveTemplateDir() {
    // 本文件编译后位于 <包根>/dist/maui/,上跳两级即包根(node_modules/@napacitor/cli)
    const cliRoot = path.resolve(__dirname, '..', '..');
    const packaged = path.join(cliRoot, 'assets', 'maui-template');
    if (await (0, fs_1.pathExists)(packaged)) {
        return packaged;
    }
    (0, common_1.fatal)(`maui 模板 assets 缺失:${packaged}` +
        ' —— @napacitor/cli 包安装不完整,请重新安装后重试');
}
