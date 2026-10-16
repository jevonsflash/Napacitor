#!/usr/bin/env node
/**
 * sync-maui-template.mjs —— maui-template/ → cli/assets/maui-template/
 *
 * 对应 Capacitor 的机制:android-template 以归档形式内置在 @capacitor/cli 的
 * assets 中,`cap add android` 解压使用;Napacitor 改为目录复制(等价、可 diff)。
 */
import { cpSync, existsSync, readdirSync, rmSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(repoRoot, 'maui-template');
const dest = path.join(repoRoot, 'cli', 'assets', 'maui-template');

if (!existsSync(src)) {
  console.error(`✖ 未找到 ${src}(请在本仓库根目录执行)`);
  process.exit(1);
}

function countFiles(dir) {
  let count = 0;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      count += countFiles(full);
    } else {
      count++;
    }
  }
  return count;
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });

console.log(`✓ maui-template → cli/assets/maui-template(${countFiles(dest)} 个文件)`);
