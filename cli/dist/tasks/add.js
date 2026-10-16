"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = addCommand;
const add_1 = require("../maui/add");
async function addCommand(config) {
    await (0, add_1.addMaui)(config);
}
