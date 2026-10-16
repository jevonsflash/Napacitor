"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCommand = syncCommand;
const copy_1 = require("../maui/copy");
const update_1 = require("../maui/update");
async function syncCommand(config) {
    await (0, copy_1.copyMaui)(config);
    await (0, update_1.updateMaui)(config);
    console.log('\n✓ sync 完成:wwwroot 已更新,napacitor.build.props 已重新生成');
}
