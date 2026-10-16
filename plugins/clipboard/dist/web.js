"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardWeb = void 0;
class ClipboardWeb {
    async write(options) {
        if (typeof options.string === 'string') {
            await navigator.clipboard.writeText(options.string);
            return;
        }
        throw new Error('Clipboard.write:浏览器端仅支持写入文本(string)');
    }
    async read() {
        return { value: await navigator.clipboard.readText() };
    }
}
exports.ClipboardWeb = ClipboardWeb;
