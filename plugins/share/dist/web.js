"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareWeb = void 0;
class ShareWeb {
    async share(options) {
        if (typeof navigator.share !== 'function') {
            throw new Error('Share.share:此浏览器不支持 Web Share API(navigator.share)');
        }
        await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url,
        });
    }
    async canShare() {
        return { canShare: typeof navigator.share === 'function' };
    }
}
exports.ShareWeb = ShareWeb;
