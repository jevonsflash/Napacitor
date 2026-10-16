/**
 * 轻量 ANSI 颜色(替代 Capacitor CLI 的 @ionic/utils-terminal)。
 * 输出非 TTY 或设置 NO_COLOR 时自动禁用。
 */

const enabled =
  !!process.stdout.isTTY && process.env['NO_COLOR'] === undefined;

function wrap(open: string, close: string): (text: string) => string {
  return (text: string) => (enabled ? `${open}${text}${close}` : text);
}

export const strong = wrap('\x1b[1m', '\x1b[22m');
export const weak = wrap('\x1b[2m', '\x1b[22m');
export const info = wrap('\x1b[36m', '\x1b[39m');
export const success = wrap('\x1b[32m', '\x1b[39m');
export const run = wrap('\x1b[33m', '\x1b[39m');
export const fail = wrap('\x1b[31m', '\x1b[39m');
