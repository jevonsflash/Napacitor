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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Napacitor = exports.NapacitorException = exports.registerPlugin = void 0;
/**
 * @napacitor/core 入口(与 Capacitor core 的 index.ts 策略一致):
 *  - 原生环境:window.Napacitor 已由注入的 native-bridge 安装,直接复用
 *  - 浏览器:安装 web 运行时,registerPlugin 分发到各插件的 web 实现
 */
const runtime_1 = require("./runtime");
var runtime_2 = require("./runtime");
Object.defineProperty(exports, "registerPlugin", { enumerable: true, get: function () { return runtime_2.registerPlugin; } });
var runtime_3 = require("./runtime");
Object.defineProperty(exports, "NapacitorException", { enumerable: true, get: function () { return runtime_3.NapacitorException; } });
__exportStar(require("./definitions"), exports);
// 装配全局对象:原生环境为 no-op(已注入),浏览器安装 web 运行时
(0, runtime_1.installWebRuntime)();
/** Napacitor 全局对象的类型化引用。 */
exports.Napacitor = globalThis['Napacitor'];
