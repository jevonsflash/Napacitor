/**
 * @napacitor/file-viewer 浏览器实现。
 * 与 Capacitor 的 File Viewer 一致:仅原生平台可用,web 端不支持。
 */
import type {
  OpenFromLocalPathOptions,
  OpenFromResourcesOptions,
  OpenFromUrlOptions,
} from './definitions';

export class FileViewerWeb {
  async openDocumentFromLocalPath(_options: OpenFromLocalPathOptions): Promise<void> {
    throw new Error('FileViewer.openDocumentFromLocalPath:仅原生平台可用');
  }

  async openDocumentFromResources(_options: OpenFromResourcesOptions): Promise<void> {
    throw new Error('FileViewer.openDocumentFromResources:仅原生平台可用');
  }

  async openDocumentFromUrl(_options: OpenFromUrlOptions): Promise<void> {
    throw new Error('FileViewer.openDocumentFromUrl:仅原生平台可用');
  }
}
