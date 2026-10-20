#!/usr/bin/env node
/**
 * sync-native-bridge.mjs —— core/dist/native-bridge.js → maui/src/JSBridge/
 *
 * 对应 Capacitor 的链路:core 的 native-bridge.ts 单独构建为 native-bridge.js,
 * 构建脚本复制进 Android 原生库 assets,由原生端注入 WebView。
 * Napacitor 中它作为 Napacitor.csproj 的 EmbeddedResource(napacitor-native-bridge.js)
 * 由 NapacitorRuntime eval 注入。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(repoRoot, 'core', 'dist', 'native-bridge.js');
const dest = path.join(repoRoot, 'maui', 'src', 'JSBridge', 'napacitor-native-bridge.js');

if (!existsSync(src)) {
  console.error(`✖ 未找到 ${src}(请先构建 core:npm run build --workspace core)`);
  process.exit(1);
}

const cjs = readFileSync(src, 'utf8');

// 顶层 "use strict" 指令由 IIFE 自身提供,剥离原指令避免成为无效语句。
const body = cjs.replace(/^"use strict";\r?\n/, '');

const bridge = `
(function () {
  'use strict';
  // exports/module 垫片:吸收 tsc CJS 输出的顶层导出语句,隔离为纯脚本。
  var module = { exports: {} };
  var exports = module.exports;

${body}
})();
`;

mkdirSync(path.dirname(dest), { recursive: true });
writeFileSync(dest, bridge, 'utf8');

console.log('✓ core/dist/native-bridge.js → maui/src/JSBridge/napacitor-native-bridge.js');
