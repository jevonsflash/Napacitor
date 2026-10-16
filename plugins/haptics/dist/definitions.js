"use strict";
/**
 * @napacitor/haptics 类型定义(与 @capacitor/haptics 对应)。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ImpactStyle = void 0;
/** impact() 触觉强度(与 @capacitor/haptics 的枚举同形)。 */
var ImpactStyle;
(function (ImpactStyle) {
    ImpactStyle["Light"] = "LIGHT";
    ImpactStyle["Medium"] = "MEDIUM";
    ImpactStyle["Heavy"] = "HEAVY";
})(ImpactStyle || (exports.ImpactStyle = ImpactStyle = {}));
/** notification() 触觉类型(与 @capacitor/haptics 的枚举同形)。 */
var NotificationType;
(function (NotificationType) {
    NotificationType["Success"] = "SUCCESS";
    NotificationType["Warning"] = "WARNING";
    NotificationType["Error"] = "ERROR";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
