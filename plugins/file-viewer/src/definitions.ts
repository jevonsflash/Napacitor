/**
 * @napacitor/file-viewer 类型定义。
 * 用系统查看器打开文件(封装 MAUI Launcher.OpenAsync / FileSystem API;
 * Android:Intent.ACTION_VIEW / iOS:UIDocumentInteractionController /
 * Windows:系统默认打开方式)。
 */

/** openDocumentFromLocalPath() 参数。 */
export interface OpenFromLocalPathOptions {
  /** 文件的绝对路径。 */
  path: string;
}

/** openDocumentFromResources() 参数。 */
export interface OpenFromResourcesOptions {
  /** 应用包内资源的相对路径(MAUI Resources/Raw 下,如 'docs/sample.pdf')。 */
  path: string;
}

/** openDocumentFromUrl() 参数。 */
export interface OpenFromUrlOptions {
  /** 指向文件的远程地址(交由系统浏览器/下载器处理)。 */
  url: string;
}

export interface FileViewerPlugin {
  /** 打开本地文件系统中的文件。 */
  openDocumentFromLocalPath(options: OpenFromLocalPathOptions): Promise<void>;
  /** 打开应用包内资源文件(复制到缓存目录后交给系统查看器)。 */
  openDocumentFromResources(options: OpenFromResourcesOptions): Promise<void>;
  /** 打开远程文件(交由系统处理)。 */
  openDocumentFromUrl(options: OpenFromUrlOptions): Promise<void>;
}
