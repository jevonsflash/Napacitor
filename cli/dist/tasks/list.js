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
exports.listCommand = listCommand;
/**
 * `nap list`:列出应用已安装的 @napacitor/* 包
 * (与 Capacitor CLI 的 tasks/list.ts 对应)。
 */
const path = __importStar(require("node:path"));
const colors = __importStar(require("../colors"));
const fs_1 = require("../util/fs");
async function listCommand(appDir) {
    var _a, _b;
    const pkg = await (0, fs_1.readJsonFile)(path.join(appDir, 'package.json'));
    if (pkg === null) {
        console.log(colors.weak(`未找到 ${path.join(appDir, 'package.json')}`));
        return;
    }
    const deps = {
        ...((_a = pkg.devDependencies) !== null && _a !== void 0 ? _a : {}),
        ...((_b = pkg.dependencies) !== null && _b !== void 0 ? _b : {}),
    };
    const napacitorPkgs = Object.keys(deps)
        .filter((name) => name.startsWith('@napacitor/'))
        .sort();
    if (napacitorPkgs.length === 0) {
        console.log('尚未安装任何 @napacitor/* 包');
        return;
    }
    console.log(`已安装的 Napacitor 包(${napacitorPkgs.length}):`);
    for (const name of napacitorPkgs) {
        console.log(`  ${colors.strong(name)} ${colors.weak(deps[name])}`);
    }
}
