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
import { assetTemplateTokens } from './assets';

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
      // 颜色令牌:模板的 __ICON_COLOR__ 等占位符(未配置 assets 时取默认品牌色,
      // 之后可通过 `nap assets` 幂等更新)
      await replaceTokensInTree(hostDir, {
        __APP_ID__: config.appId,
        __APP_NAME__: config.appName,
        ...assetTemplateTokens(config),
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

  // 品牌资产不随 add 自动应用(源图缺失等配置错误不应让 add 失败),仅提示
  if (config.assets) {
    console.log(
      colors.weak('提示:检测到 assets 配置 —— 运行 "nap assets" 应用品牌图标/启动屏/主题颜色'),
    );
  }
}
