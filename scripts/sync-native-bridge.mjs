#!/usr/bin/env node
/**
 * sync-native-bridge.mjs —— core/dist/native-bridge.js → maui/src/JSBridge/
 *
 * 对应 Capacitor 的链路:core 的 native-bridge.ts 单独构建为 native-bridge.js,
 * 构建脚本复制进 Android 原生库 assets,由原生端注入 WebView。
 * Napacitor 中它作为 Napacitor.csproj 的 EmbeddedResource(napacitor-native-bridge.js)
 * 由 NapacitorRuntime eval 注入。
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(repoRoot, 'core', 'dist', 'native-bridge.js');
const dest = path.join(repoRoot, 'maui', 'src', 'JSBridge', 'napacitor-native-bridge.js');

if (!existsSync(src)) {
  console.error(`✖ 未找到 ${src}(请先构建 core:npm run build --workspace core)`);
  process.exit(1);
}

mkdirSync(path.dirname(dest), { recursive: true });
copyFileSync(src, dest);

console.log('✓ core/dist/native-bridge.js → maui/src/JSBridge/napacitor-native-bridge.js');
