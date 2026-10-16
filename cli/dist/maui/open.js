"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openMaui = openMaui;
/**
 * `nap open maui`:用系统默认方式打开宿主工程(与 Capacitor CLI 的 open.ts 对应)。
 */
const common_1 = require("../common");
const subprocess_1 = require("../util/subprocess");
const common_2 = require("./common");
async function openMaui(config) {
    await (0, common_2.requireHost)(config);
    const csproj = (0, common_2.hostCsprojPath)(config);
    await (0, common_1.runTask)(`打开宿主工程(${csproj})`, async () => {
        if (process.platform === 'win32') {
            await (0, subprocess_1.runCommand)('cmd', ['/c', 'start', '', csproj]);
        }
        else if (process.platform === 'darwin') {
            await (0, subprocess_1.runCommand)('open', [csproj]);
        }
        else {
            await (0, subprocess_1.runCommand)('xdg-open', [csproj]);
        }
    });
}
