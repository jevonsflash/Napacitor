"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HapticsWeb = void 0;
/**
 * @napacitor/haptics 浏览器实现(与 @capacitor/haptics 的 web 实现对应)。
 * 基于 Vibration API(navigator.vibrate),不支持的浏览器为静默无操作。
 */
const definitions_1 = require("./definitions");
/** impact 强度 → 振动时长(毫秒)。 */
const impactDurations = {
    LIGHT: 10,
    MEDIUM: 25,
    HEAVY: 40,
};
/** notification 类型 → 振动时长(毫秒)。 */
const notificationDurations = {
    SUCCESS: 35,
    WARNING: 45,
    ERROR: 60,
};
class HapticsWeb {
    async impact(options) {
        var _a, _b;
        const style = (_a = options === null || options === void 0 ? void 0 : options.style) !== null && _a !== void 0 ? _a : definitions_1.ImpactStyle.Medium;
        this.vibrateFor((_b = impactDurations[style]) !== null && _b !== void 0 ? _b : 25);
    }
    async notification(options) {
        var _a, _b;
        const type = (_a = options === null || options === void 0 ? void 0 : options.type) !== null && _a !== void 0 ? _a : definitions_1.NotificationType.Success;
        this.vibrateFor((_b = notificationDurations[type]) !== null && _b !== void 0 ? _b : 35);
    }
    async vibrate(options) {
        var _a;
        this.vibrateFor((_a = options === null || options === void 0 ? void 0 : options.duration) !== null && _a !== void 0 ? _a : 60);
    }
    async selection() {
        this.vibrateFor(10);
    }
    async selectionChanged() {
        this.vibrateFor(10);
    }
    vibrateFor(duration) {
        if (typeof navigator.vibrate === 'function') {
            navigator.vibrate(duration);
        }
    }
}
exports.HapticsWeb = HapticsWeb;
