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
exports.pathExists = pathExists;
exports.readTextFile = readTextFile;
exports.readJsonFile = readJsonFile;
exports.writeTextFile = writeTextFile;
exports.listFilesRecursive = listFilesRecursive;
exports.copyDir = copyDir;
exports.emptyDir = emptyDir;
exports.replaceTokensInTree = replaceTokensInTree;
/**
 * 零依赖文件系统助手(替代 Capacitor CLI 的 @ionic/utils-fs)。
 * 全部基于 node:fs/promises 内建实现。
 */
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
/** 路径是否存在。 */
async function pathExists(target) {
    try {
        await fs.stat(target);
        return true;
    }
    catch {
        return false;
    }
}
/** 读取文本文件(utf8)。 */
async function readTextFile(file) {
    return fs.readFile(file, 'utf8');
}
/** 读取 JSON 文件;文件不存在返回 null,解析失败抛出原错误。 */
async function readJsonFile(file) {
    if (!(await pathExists(file))) {
        return null;
    }
    const text = await readTextFile(file);
    return JSON.parse(text);
}
/** 写文本文件(自动创建父目录)。 */
async function writeTextFile(file, data) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
}
/** 递归列出目录下全部文件的相对路径(相对 dir)。 */
async function listFilesRecursive(dir) {
    const result = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await listFilesRecursive(full);
            for (const name of nested) {
                result.push(path.join(entry.name, name));
            }
        }
        else if (entry.isFile()) {
            result.push(entry.name);
        }
    }
    return result;
}
/** 递归复制目录(覆盖同名文件)。 */
async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const from = path.join(src, entry.name);
        const to = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(from, to);
        }
        else if (entry.isFile()) {
            await fs.copyFile(from, to);
        }
    }
}
/** 清空目录(删除全部内容后重建空目录)。 */
async function emptyDir(dir) {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
}
/**
 * 在文本文件内替换全部令牌(tokens 形如 { __APP_ID__: 'com.x.y' })。
 * 仅对白名单内的文本扩展名生效,其余文件跳过。
 */
const TEXT_EXTENSIONS = new Set([
    '.cs', '.csproj', '.xaml', '.razor', '.props', '.targets',
    '.json', '.html', '.plist', '.xml', '.manifest', '.js', '.css', '.svg',
    '.txt', '.md',
]);
async function replaceTokensInTree(dir, tokens) {
    const files = await listFilesRecursive(dir);
    for (const file of files) {
        if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) {
            continue;
        }
        const full = path.join(dir, file);
        let text = await readTextFile(full);
        let changed = false;
        for (const [token, value] of Object.entries(tokens)) {
            if (text.indexOf(token) >= 0) {
                text = text.split(token).join(value);
                changed = true;
            }
        }
        if (changed) {
            await fs.writeFile(full, text);
        }
    }
}
