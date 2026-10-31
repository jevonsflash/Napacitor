/**
 * @napacitor/filesystem 浏览器实现。
 * 文件选取经 <input type="file"> + FileReader;捆绑文件经 fetch;
 * 目录与文件复制在浏览器无对应能力,不支持。
 */
import type {
  BundleFileResult,
  CopyBundleFileOptions,
  CopyBundleFileResult,
  DirectoryPaths,
  PickFileOptions,
  PickedFile,
  ReadBundleFileOptions,
} from './definitions';

export class FilesystemWeb {
  async getDirectoryPaths(): Promise<DirectoryPaths> {
    throw new Error('Filesystem.getDirectoryPaths:仅原生平台可用');
  }

  async readBundleFile(options: ReadBundleFileOptions): Promise<BundleFileResult> {
    const response = await fetch(options.path);
    if (!response.ok) {
      throw new Error(
        `Filesystem.readBundleFile:读取失败(${response.status} ${response.statusText})`,
      );
    }
    return { data: await response.text() };
  }

  async copyBundleFile(_options: CopyBundleFileOptions): Promise<CopyBundleFileResult> {
    throw new Error('Filesystem.copyBundleFile:仅原生平台可用');
  }

  async pickFile(options?: PickFileOptions): Promise<PickedFile | null> {
    const files = await this.pickWebFiles(false, options);
    return files.length > 0 ? files[0] : null;
  }

  async pickFiles(options?: PickFileOptions): Promise<PickedFile[]> {
    return this.pickWebFiles(true, options);
  }

  /** 经隐藏 <input type="file"> 选取文件(取消选择返回空数组)。 */
  private pickWebFiles(
    multiple: boolean,
    options?: PickFileOptions,
  ): Promise<PickedFile[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      if (options?.types === 'images') {
        input.accept = 'image/*';
      } else if (options?.types === 'videos') {
        input.accept = 'video/*';
      }

      input.onchange = () => {
        void this.readWebFiles(Array.from(input.files ?? [])).then(resolve, reject);
      };

      // 浏览器对"取消选择"没有原生事件,用窗口焦点恢复兜底:
      // 用户选择完或取消后窗口都会重新获得焦点。
      const onFocus = () => {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => {
          if ((input.files?.length ?? 0) === 0) {
            resolve([]);
          }
        }, 300);
      };
      window.addEventListener('focus', onFocus);

      input.click();
    });
  }

  private async readWebFiles(files: File[]): Promise<PickedFile[]> {
    const results: PickedFile[] = [];
    for (const file of files) {
      results.push(await this.readWebFile(file));
    }
    return results;
  }

  private readWebFile(file: File): Promise<PickedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const base64 = url.slice(url.indexOf(',') + 1);
        resolve({ name: file.name, size: file.size, data: base64 });
      };
      reader.onerror = () => reject(reader.error ?? new Error('Filesystem:读取文件失败'));
      reader.readAsDataURL(file);
    });
  }
}
