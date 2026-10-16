/**
 * 轻量 ANSI 颜色(替代 Capacitor CLI 的 @ionic/utils-terminal)。
 * 输出非 TTY 或设置 NO_COLOR 时自动禁用。
 */
export declare const strong: (text: string) => string;
export declare const weak: (text: string) => string;
export declare const info: (text: string) => string;
export declare const success: (text: string) => string;
export declare const run: (text: string) => string;
export declare const fail: (text: string) => string;
