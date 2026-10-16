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
exports.runCommand = runCommand;
/**
 * 子进程封装(与 Capacitor CLI 的 util/subprocess 对应,做了零依赖精简)。
 */
const node_child_process_1 = require("node:child_process");
const common_1 = require("../common");
const colors = __importStar(require("../colors"));
/** 以透传 stdio 运行命令,非零退出码或命令不存在时终止 CLI。 */
async function runCommand(command, args, options) {
    console.log(colors.run(`> ${command} ${args.join(' ')}`));
    await new Promise((resolve, reject) => {
        const child = (0, node_child_process_1.spawn)(command, args, {
            stdio: 'inherit',
            ...options,
        });
        child.on('error', (err) => {
            reject(err);
        });
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`${command} 以退出码 ${code} 结束`));
            }
        });
    }).catch((err) => {
        if (err.message.indexOf('ENOENT') >= 0) {
            (0, common_1.fatal)(`未找到命令 "${command}",请确认已安装并在 PATH 中`);
        }
        (0, common_1.fatal)(err.message);
    });
}
