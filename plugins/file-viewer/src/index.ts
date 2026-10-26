/**
 * @napacitor/file-viewer 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { FileViewerPlugin } from './definitions';

const FileViewer = registerPlugin<FileViewerPlugin>('FileViewer', {
  web: () => import('./web').then((m) => new m.FileViewerWeb()),
});

export * from './definitions';
export { FileViewer };
