/**
 * `nap init`:初始化应用,写入 napacitor.config.json
 * (与 Capacitor CLI 的 tasks/init.ts 对应;非交互,参数缺失时用默认值)。
 */
import * as path from 'node:path';
import * as colors from '../colors';
import { pathExists, writeTextFile } from '../util/fs';
import { fatal } from '../common';

export async function initCommand(
  appDir: string,
  args: string[],
  options: Record<string, string>,
): Promise<void> {
  const appId = args[0] ?? 'com.napacitor.app';
  const appName = args[1] ?? path.basename(appDir);
  const webDir = options['web-dir'] ?? 'dist';

  const configPath = path.join(appDir, 'napacitor.config.json');
  if (await pathExists(configPath)) {
    fatal(`${configPath} 已存在 —— 如需重新初始化请先删除该文件`);
  }

  const config = {
    appId,
    appName,
    webDir,
    maui: { hostDir: 'maui' },
  };
  await writeTextFile(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log(colors.success(`✓ 已写入 ${configPath}`));
  console.log(`  appId    = ${colors.strong(appId)}`);
  console.log(`  appName  = ${colors.strong(appName)}`);
  console.log(`  webDir   = ${colors.strong(webDir)}`);
  console.log(
    `\n下一步(与 Capacitor 工作流同形):\n` +
    `  1. npm install @napacitor/core @napacitor/maui @napacitor/cli --save-dev\n` +
    `  2. npm install @napacitor/device            # 按需安装插件\n` +
    `  3. 构建 Web 应用(产物输出到 ${webDir}/)\n` +
    `  4. nap add maui && nap sync && nap run`);
}
