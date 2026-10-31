/**
 * @napacitor/camera 浏览器实现。
 * 拍照 / 录像经 <input type="file" capture>;媒体库选取经
 * <input type="file" accept>;图像处理字段(缩放 / 压缩 / 旋转)
 * 在浏览器不生效,仅原生平台处理。
 */
import type { MediaFile, PickMediaOptions } from './definitions';

export class CameraWeb {
  isCaptureSupported(): Promise<boolean> {
    // 浏览器总可打开文件选择器;capture 属性在支持的系统上打开相机。
    return Promise.resolve(true);
  }

  pickPhotos(options?: PickMediaOptions): Promise<MediaFile[]> {
    return this.pickWebMedia('image/*', false, options);
  }

  pickVideos(options?: PickMediaOptions): Promise<MediaFile[]> {
    return this.pickWebMedia('video/*', false, options);
  }

  capturePhoto(options?: PickMediaOptions): Promise<MediaFile | null> {
    return this.pickWebMedia('image/*', true, options).then((files) =>
      files.length > 0 ? files[0] : null,
    );
  }

  captureVideo(options?: PickMediaOptions): Promise<MediaFile | null> {
    return this.pickWebMedia('video/*', true, options).then((files) =>
      files.length > 0 ? files[0] : null,
    );
  }

  /** 经隐藏 <input type="file"> 选取媒体(取消选择返回空数组)。 */
  private pickWebMedia(
    accept: string,
    capture: boolean,
    options?: PickMediaOptions,
  ): Promise<MediaFile[]> {
    const limit = options?.selectionLimit ?? 1;
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = limit !== 1;
      if (capture) {
        // 移动端打开系统相机;桌面浏览器忽略该属性,退回文件选择器。
        input.setAttribute('capture', 'environment');
      }

      input.onchange = () => {
        let files = Array.from(input.files ?? []);
        if (limit > 1 && files.length > limit) {
          files = files.slice(0, limit);
        }
        void this.readWebFiles(files).then(resolve, reject);
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

  private async readWebFiles(files: File[]): Promise<MediaFile[]> {
    const results: MediaFile[] = [];
    for (const file of files) {
      results.push(await this.readWebFile(file));
    }
    return results;
  }

  private readWebFile(file: File): Promise<MediaFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const base64 = url.slice(url.indexOf(',') + 1);
        resolve({
          name: file.name,
          size: file.size,
          contentType: file.type || undefined,
          data: base64,
        });
      };
      reader.onerror = () => reject(reader.error ?? new Error('Camera:读取媒体失败'));
      reader.readAsDataURL(file);
    });
  }
}
