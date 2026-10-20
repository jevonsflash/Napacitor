/**
 * `nap copy maui`:Web 构建产物 → 宿主 wwwroot(与 Capacitor CLI 的 android/copy.ts 对应)。
 *
 * 除纯复制外还做“宿主化改造”:
 *  - 收集并摘除 index.html 中的本地 <script src>(远程脚本保留)
 *  - 注入 #napacitor-root 挂载点与 blazor.webview.js 引导脚本(幂等)
 *  - 写 napacitor.entries.json(本地入口脚本清单,由 C# 运行时按序 import)
 *  - 拷入 napacitor.config.json(供原生端读取插件配置)
 */
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { CLIConfig } from '../definitions';
import { fatal, runTask } from '../common';
import * as colors from '../colors';
import { copyDir, emptyDir, pathExists, readTextFile, writeTextFile } from '../util/fs';
import { requireHost, wwwrootDirAbs } from './common';

const ROOT_DIV = '<div id="napacitor-root"></div>';
const BLAZOR_SCRIPT =
  '<script src="_framework/blazor.webview.js" autostart="false"></script>';

export async function copyMaui(config: CLIConfig): Promise<void> {
  const webDirAbs = path.resolve(config.appDir, config.webDir);
  if (!(await pathExists(webDirAbs))) {
    fatal(
      `webDir "${config.webDir}" 不存在 —— 请先构建 Web 应用` +
      `(如 npm run build),或用 --web-dir 指定正确的产物目录`);
  }
  await requireHost(config);

  const wwwroot = wwwrootDirAbs(config);
  await runTask(`复制 Web 构建产物(${config.webDir}/ → wwwroot/)`, async () => {
    await emptyDir(wwwroot);
    await copyDir(webDirAbs, wwwroot);
  });

  let entries: string[] = [];
  await runTask('宿主化改造 index.html', async () => {
    const indexPath = path.join(wwwroot, 'index.html');
    if (!(await pathExists(indexPath))) {
      fatal(`未找到 ${indexPath} —— Web 构建产物缺少 index.html`);
    }
    const html = await readTextFile(indexPath);
    const { html: patched, entries: localScripts } = transformIndexHtml(html);
    entries = localScripts;
    await writeTextFile(indexPath, patched);
    await writeTextFile(
      path.join(wwwroot, 'napacitor.entries.json'),
      JSON.stringify(entries, null, 2) + '\n',
    );
  });
  console.log(
    colors.weak(
      entries.length > 0
        ? `  入口脚本(${entries.length}):${entries.join(', ')}`
        : '  未发现本地入口脚本(wwwroot 中无 <script src> 被摘除)',
    ),
  );

  await runTask('拷入 napacitor.config.json', async () => {
    const src = path.join(config.appDir, 'napacitor.config.json');
    await fs.copyFile(src, path.join(wwwroot, 'napacitor.config.json'));
  });

  console.log(colors.success('✓ copy 完成(下次构建 Web 后请再运行 nap copy / nap sync)'));
}

/**
 * index.html 宿主化改造:
 * 返回改造后的 HTML 与被摘除的本地脚本路径列表(按文档序)。
 */
export function transformIndexHtml(html: string): {
  html: string;
  entries: string[];
} {
  const entries: string[] = [];
  let hasBlazorScript = false;

  const scriptTagRe = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
  let result = html.replace(scriptTagRe, (tag: string, src: string): string => {
    if (/^https?:\/\//i.test(src)) {
      return tag; // 远程脚本(如 CDN)原样保留
    }
    if (src === '_framework/blazor.webview.js') {
      hasBlazorScript = true;
      return tag; // Blazor 引导脚本保留
    }
    entries.push(toModuleSpecifier(src)); // 本地脚本:摘除,交由原生运行时按序 import
    return '';
  });

  // 注入 Blazor 根组件挂载点(幂等)
  if (result.indexOf('id="napacitor-root"') < 0 && result.indexOf("id='napacitor-root'") < 0) {
    result = insertBeforeBodyEnd(result, ROOT_DIV);
  }
  // 注入 Blazor 引导脚本(幂等)
  if (!hasBlazorScript) {
    result = insertBeforeBodyEnd(result, BLAZOR_SCRIPT);
  }
  return { html: result, entries };
}

/**
 * 本地脚本路径 → ES 模块说明符:Blazor JSInterop 的 import 仅把 "./" 前缀解析为
 * 相对 document.baseURI 的 URL,裸文件名(如 "app.js")会被 WebKit 判为非法模块名。
 */
function toModuleSpecifier(src: string): string {
  if (/^[./]/.test(src) || /^[a-z][a-z0-9+.-]*:/i.test(src)) {
    return src;
  }
  return `./${src}`;
}

function insertBeforeBodyEnd(html: string, snippet: string): string {
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `    ${snippet}\n</body>`);
  }
  return html + snippet;
}
