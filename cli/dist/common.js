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
exports.fatal = fatal;
exports.runTask = runTask;
exports.check = check;
/**
 * CLI 公共助手(与 Capacitor CLI 的 common.ts 对应,做了零依赖精简)。
 */
const colors = __importStar(require("./colors"));
/** 终止 CLI:打印红色错误并退出。 */
function fatal(message) {
    console.error(colors.fail(`✖ ${message}`));
    process.exit(1);
}
/** 打印任务标题(与 Capacitor 的 runTask 对应;无 spinner,直接顺序输出)。 */
async function runTask(title, fn) {
    console.log(`\n${colors.strong(title)}`);
    return fn();
}
/** 断言:值为假时 fatal。 */
function check(value, message) {
    if (!value) {
        fatal(message);
    }
}
