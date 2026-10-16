"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatteryWeb = void 0;
class BatteryWeb {
    async getBatteryInfo() {
        const battery = await this.getBattery();
        return { batteryLevel: battery.level, isCharging: battery.charging };
    }
    async addListener(eventName, callback) {
        void eventName;
        const battery = await this.getBattery();
        const handler = () => callback({ batteryLevel: battery.level, isCharging: battery.charging });
        battery.addEventListener('levelchange', handler);
        battery.addEventListener('chargingchange', handler);
        return {
            remove: async () => {
                battery.removeEventListener('levelchange', handler);
                battery.removeEventListener('chargingchange', handler);
            },
        };
    }
    async removeAllListeners() {
        // 监听器由各自句柄的 remove() 移除;此处无全局需要清理的状态
    }
    getBattery() {
        const nav = navigator;
        if (typeof nav.getBattery !== 'function') {
            return Promise.reject(new Error('Battery.getBatteryInfo:此浏览器不支持 Battery Status API'));
        }
        return nav.getBattery();
    }
}
exports.BatteryWeb = BatteryWeb;
