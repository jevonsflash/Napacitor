/**
 * `nap add maui`:从模板生成宿主工程(与 Capacitor CLI 的 android/add.ts 对应)。
 */
import * as path from 'node:path';
import type { CLIConfig } from '../definitions';
import { fatal, runTask } from '../common';
import * as colors from '../colors';
import { copyDir, pathExists, replaceTokensInTree } from '../util/fs';
import { hostDirAbs, requireHost, resolveTemplateDir } from './common';
import { copyMaui } from './copy';
import { updateMaui } from './update';

export async function addMaui(config: CLIConfig): Promise<void> {
  const hostDir = hostDirAbs(config);
  if (await pathExists(hostDir)) {
    fatal(`${hostDir} 已存在 —— 如需重新添加平台请先删除该目录`);
  }

  const templateDir = await resolveTemplateDir();
  await runTask(
    `添加 MAUI 平台(模板 → ${config.maui.hostDir}/)`,
    async () => {
      await copyDir(templateDir, hostDir);
      await replaceTokensInTree(hostDir, {
        __APP_ID__: config.appId,
        __APP_NAME__: config.appName,
      });
    },
  );
  console.log(colors.success(`✓ 宿主工程已生成:${hostDir}`));

  // 镜像 Capacitor 的 add.ts:webDir 已构建则自动执行一次 copy + update
  const webDirAbs = path.resolve(config.appDir, config.webDir);
  if (await pathExists(webDirAbs)) {
    await copyMaui(config);
    await updateMaui(config);
  } else {
    console.log(
      colors.weak(
        `提示:webDir "${config.webDir}" 尚未构建,已跳过自动 sync` +
        ' —— 构建 Web 应用后运行 "nap sync"'),
    );
  }
}
