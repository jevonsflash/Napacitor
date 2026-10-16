"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTaskCommand = runTaskCommand;
const run_1 = require("../maui/run");
async function runTaskCommand(config, options) {
    await (0, run_1.runMaui)(config, options);
}
