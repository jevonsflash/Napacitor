"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceWeb = void 0;
class DeviceWeb {
    async getInfo() {
        var _a;
        return {
            model: navigator.userAgent,
            platform: 'web',
            osVersion: '',
            manufacturer: (_a = navigator.vendor) !== null && _a !== void 0 ? _a : '',
            isVirtual: false,
        };
    }
    async getLanguageCode() {
        var _a;
        return {
            value: (_a = navigator.language.split('-')[0]) !== null && _a !== void 0 ? _a : 'en',
        };
    }
    async getLocale() {
        return {
            value: navigator.language,
        };
    }
}
exports.DeviceWeb = DeviceWeb;
