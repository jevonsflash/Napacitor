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
exports.loadConfig = loadConfig;
/**
 * napacitor.config.json 的读取与校验(与 Capacitor CLI 的 config.ts 对应)。
 */
const path = __importStar(require("node:path"));
const fs_1 = require("./util/fs");
const common_1 = require("./common");
/**
 * 加载并校验 napacitor.config.json。
 * 文件缺失或必填字段(appId / appName / webDir)非法时终止 CLI。
 */
async function loadConfig(appDir) {
    const configPath = path.join(appDir, 'napacitor.config.json');
    const raw = (await (0, fs_1.readJsonFile)(configPath));
    if (raw === null) {
        (0, common_1.fatal)(`未找到 ${configPath} —— 请先在应用目录运行 "nap init" 初始化`);
    }
    const appId = typeof raw.appId === 'string' ? raw.appId.trim() : '';
    const appName = typeof raw.appName === 'string' ? raw.appName.trim() : '';
    const webDir = typeof raw.webDir === 'string' ? raw.webDir.trim() : '';
    if (!appId || !appName || !webDir) {
        (0, common_1.fatal)('napacitor.config.json 缺少必填字段:appId / appName / webDir 均为非空字符串');
    }
    const hostDir = raw.maui &&
        typeof raw.maui === 'object' &&
        typeof raw.maui.hostDir === 'string'
        ? raw.maui.hostDir
        : 'maui';
    const plugins = raw.plugins && typeof raw.plugins === 'object'
        ? raw.plugins
        : {};
    return {
        appDir,
        appId,
        appName,
        webDir,
        maui: { hostDir },
        plugins,
        raw: raw,
    };
}
