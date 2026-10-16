"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openCommand = openCommand;
const open_1 = require("../maui/open");
async function openCommand(config) {
    await (0, open_1.openMaui)(config);
}
