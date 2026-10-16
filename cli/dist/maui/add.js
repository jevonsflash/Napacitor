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
exports.addMaui = addMaui;
/**
 * `nap add maui`:从模板生成宿主工程(与 Capacitor CLI 的 android/add.ts 对应)。
 */
const path = __importStar(require("node:path"));
const common_1 = require("../common");
const colors = __importStar(require("../colors"));
const fs_1 = require("../util/fs");
const common_2 = require("./common");
const copy_1 = require("./copy");
const update_1 = require("./update");
async function addMaui(config) {
    const hostDir = (0, common_2.hostDirAbs)(config);
    if (await (0, fs_1.pathExists)(hostDir)) {
        (0, common_1.fatal)(`${hostDir} 已存在 —— 如需重新添加平台请先删除该目录`);
    }
    const templateDir = await (0, common_2.resolveTemplateDir)();
    await (0, common_1.runTask)(`添加 MAUI 平台(模板 → ${config.maui.hostDir}/)`, async () => {
        await (0, fs_1.copyDir)(templateDir, hostDir);
        await (0, fs_1.replaceTokensInTree)(hostDir, {
            __APP_ID__: config.appId,
            __APP_NAME__: config.appName,
        });
    });
    console.log(colors.success(`✓ 宿主工程已生成:${hostDir}`));
    // 镜像 Capacitor 的 add.ts:webDir 已构建则自动执行一次 copy + update
    const webDirAbs = path.resolve(config.appDir, config.webDir);
    if (await (0, fs_1.pathExists)(webDirAbs)) {
        await (0, copy_1.copyMaui)(config);
        await (0, update_1.updateMaui)(config);
    }
    else {
        console.log(colors.weak(`提示:webDir "${config.webDir}" 尚未构建,已跳过自动 sync` +
            ' —— 构建 Web 应用后运行 "nap sync"'));
    }
}
