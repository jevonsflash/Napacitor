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

// 模板可能被 VS 打开过而残留 .vs / bin / obj / *.user(均为 gitignored 的本地产物),
// 不属于模板内容,且 .vs 内文件常被 IDE 锁定导致拷贝 EBUSY —— 一律跳过
const EXCLUDED_DIR_NAMES = new Set(['.vs', 'bin', 'obj']);

function isTemplateAsset(target) {
  const rel = path.relative(src, target);
  if (rel === '') {
    return true;
  }
  const parts = rel.split(path.sep);
  if (parts.some((part) => EXCLUDED_DIR_NAMES.has(part))) {
    return false;
  }
  return !parts[parts.length - 1].endsWith('.user');
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
cpSync(src, dest, { recursive: true, filter: isTemplateAsset });

console.log(`✓ maui-template → cli/assets/maui-template(${countFiles(dest)} 个文件)`);
