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
exports.copyMaui = copyMaui;
exports.transformIndexHtml = transformIndexHtml;
/**
 * `nap copy maui`:Web 构建产物 → 宿主 wwwroot(与 Capacitor CLI 的 android/copy.ts 对应)。
 *
 * 除纯复制外还做“宿主化改造”:
 *  - 收集并摘除 index.html 中的本地 <script src>(远程脚本保留)
 *  - 注入 #napacitor-root 挂载点与 blazor.webview.js 引导脚本(幂等)
 *  - 写 napacitor.entries.json(本地入口脚本清单,由 C# 运行时按序 import)
 *  - 拷入 napacitor.config.json(供原生端读取插件配置)
 */
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs/promises"));
const common_1 = require("../common");
const colors = __importStar(require("../colors"));
const fs_1 = require("../util/fs");
const common_2 = require("./common");
const ROOT_DIV = '<div id="napacitor-root"></div>';
const BLAZOR_SCRIPT = '<script src="_framework/blazor.webview.js" autostart="false"></script>';
async function copyMaui(config) {
    const webDirAbs = path.resolve(config.appDir, config.webDir);
    if (!(await (0, fs_1.pathExists)(webDirAbs))) {
        (0, common_1.fatal)(`webDir "${config.webDir}" 不存在 —— 请先构建 Web 应用` +
            `(如 npm run build),或用 --web-dir 指定正确的产物目录`);
    }
    await (0, common_2.requireHost)(config);
    const wwwroot = (0, common_2.wwwrootDirAbs)(config);
    await (0, common_1.runTask)(`复制 Web 构建产物(${config.webDir}/ → wwwroot/)`, async () => {
        await (0, fs_1.emptyDir)(wwwroot);
        await (0, fs_1.copyDir)(webDirAbs, wwwroot);
    });
    let entries = [];
    await (0, common_1.runTask)('宿主化改造 index.html', async () => {
        const indexPath = path.join(wwwroot, 'index.html');
        if (!(await (0, fs_1.pathExists)(indexPath))) {
            (0, common_1.fatal)(`未找到 ${indexPath} —— Web 构建产物缺少 index.html`);
        }
        const html = await (0, fs_1.readTextFile)(indexPath);
        const { html: patched, entries: localScripts } = transformIndexHtml(html);
        entries = localScripts;
        await (0, fs_1.writeTextFile)(indexPath, patched);
        await (0, fs_1.writeTextFile)(path.join(wwwroot, 'napacitor.entries.json'), JSON.stringify(entries, null, 2) + '\n');
    });
    console.log(colors.weak(entries.length > 0
        ? `  入口脚本(${entries.length}):${entries.join(', ')}`
        : '  未发现本地入口脚本(wwwroot 中无 <script src> 被摘除)'));
    await (0, common_1.runTask)('拷入 napacitor.config.json', async () => {
        const src = path.join(config.appDir, 'napacitor.config.json');
        await fs.copyFile(src, path.join(wwwroot, 'napacitor.config.json'));
    });
    console.log(colors.success('✓ copy 完成(下次构建 Web 后请再运行 nap copy / nap sync)'));
}
/**
 * index.html 宿主化改造:
 * 返回改造后的 HTML 与被摘除的本地脚本路径列表(按文档序)。
 */
function transformIndexHtml(html) {
    const entries = [];
    let hasBlazorScript = false;
    const scriptTagRe = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
    let result = html.replace(scriptTagRe, (tag, src) => {
        if (/^https?:\/\//i.test(src)) {
            return tag; // 远程脚本(如 CDN)原样保留
        }
        if (src === '_framework/blazor.webview.js') {
            hasBlazorScript = true;
            return tag; // Blazor 引导脚本保留
        }
        entries.push(src); // 本地脚本:摘除,交由原生运行时按序 import
        return '';
    });
    // 注入 Blazor 根组件挂载点(幂等)
    if (result.indexOf('id="napacitor-root"') < 0 && result.indexOf("id='napacitor-root'") < 0) {
        result = insertBeforeBodyEnd(result, ROOT_DIV);
    }
    // 注入 Blazor 引导脚本(幂等)
    if (!hasBlazorScript) {
        result = insertBeforeBodyEnd(result, BLAZOR_SCRIPT);
    }
    return { html: result, entries };
}
function insertBeforeBodyEnd(html, snippet) {
    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, `    ${snippet}\n</body>`);
    }
    return html + snippet;
}
