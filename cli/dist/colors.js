"use strict";
/**
 * 轻量 ANSI 颜色(替代 Capacitor CLI 的 @ionic/utils-terminal)。
 * 输出非 TTY 或设置 NO_COLOR 时自动禁用。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fail = exports.run = exports.success = exports.info = exports.weak = exports.strong = void 0;
const enabled = !!process.stdout.isTTY && process.env['NO_COLOR'] === undefined;
function wrap(open, close) {
    return (text) => (enabled ? `${open}${text}${close}` : text);
}
exports.strong = wrap('\x1b[1m', '\x1b[22m');
exports.weak = wrap('\x1b[2m', '\x1b[22m');
exports.info = wrap('\x1b[36m', '\x1b[39m');
exports.success = wrap('\x1b[32m', '\x1b[39m');
exports.run = wrap('\x1b[33m', '\x1b[39m');
exports.fail = wrap('\x1b[31m', '\x1b[39m');
