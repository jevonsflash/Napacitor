#!/usr/bin/env node
/**
 * nap 命令启动 shim(与 Capacitor 的 bin/capacitor 对应)。
 * 纯 JS,仅转发到 dist 构建产物。
 */
require('../dist/index.js').main();
