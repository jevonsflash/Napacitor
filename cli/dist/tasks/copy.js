"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyCommand = copyCommand;
const copy_1 = require("../maui/copy");
async function copyCommand(config) {
    await (0, copy_1.copyMaui)(config);
}
