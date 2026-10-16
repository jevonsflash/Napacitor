/**
 * 零依赖文件系统助手(替代 Capacitor CLI 的 @ionic/utils-fs)。
 * 全部基于 node:fs/promises 内建实现。
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/** 路径是否存在。 */
export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

/** 读取文本文件(utf8)。 */
export async function readTextFile(file: string): Promise<string> {
  return fs.readFile(file, 'utf8');
}

/** 读取 JSON 文件;文件不存在返回 null,解析失败抛出原错误。 */
export async function readJsonFile<T>(
  file: string,
): Promise<T | null> {
  if (!(await pathExists(file))) {
    return null;
  }
  const text = await readTextFile(file);
  return JSON.parse(text) as T;
}

/** 写文本文件(自动创建父目录)。 */
export async function writeTextFile(
  file: string,
  data: string,
): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

/** 递归列出目录下全部文件的相对路径(相对 dir)。 */
export async function listFilesRecursive(dir: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFilesRecursive(full);
      for (const name of nested) {
        result.push(path.join(entry.name, name));
      }
    } else if (entry.isFile()) {
      result.push(entry.name);
    }
  }
  return result;
}

/** 递归复制目录(覆盖同名文件)。 */
export async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else if (entry.isFile()) {
      await fs.copyFile(from, to);
    }
  }
}

/** 清空目录(删除全部内容后重建空目录)。 */
export async function emptyDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

/**
 * 在文本文件内替换全部令牌(tokens 形如 { __APP_ID__: 'com.x.y' })。
 * 仅对白名单内的文本扩展名生效,其余文件跳过。
 */
const TEXT_EXTENSIONS = new Set([
  '.cs', '.csproj', '.xaml', '.razor', '.props', '.targets',
  '.json', '.html', '.plist', '.xml', '.manifest', '.js', '.css', '.svg',
  '.txt', '.md',
]);

export async function replaceTokensInTree(
  dir: string,
  tokens: Record<string, string>,
): Promise<void> {
  const files = await listFilesRecursive(dir);
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      continue;
    }
    const full = path.join(dir, file);
    let text = await readTextFile(full);
    let changed = false;
    for (const [token, value] of Object.entries(tokens)) {
      if (text.indexOf(token) >= 0) {
        text = text.split(token).join(value);
        changed = true;
      }
    }
    if (changed) {
      await fs.writeFile(full, text);
    }
  }
}
