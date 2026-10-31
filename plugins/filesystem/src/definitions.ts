/**
 * @napacitor/filesystem 类型定义。
 * 文件系统路径与捆绑文件访问 + 系统文件选择器
 * (封装 MAUI FileSystem / FilePicker API)。
 */

/** 目录路径查询结果(对应 MAUI FileSystem.CacheDirectory / AppDataDirectory)。 */
export interface DirectoryPaths {
  /** 缓存目录(系统可能清理,勿存放关键数据)。 */
  cacheDirectory: string;
  /** 应用数据目录(随系统备份同步)。 */
  dataDirectory: string;
}

/** readBundleFile() 参数。 */
export interface ReadBundleFileOptions {
  /** 应用包内资源路径(MAUI Resources/Raw 下,如 'config/settings.json')。 */
  path: string;
}

/** readBundleFile() 结果。 */
export interface BundleFileResult {
  /** 文件文本内容(UTF-8)。 */
  data: string;
}

/** 捆绑文件复制目标目录。 */
export type BundleTargetDirectory = 'cache' | 'data';

/** copyBundleFile() 参数。 */
export interface CopyBundleFileOptions {
  /** 应用包内资源路径(MAUI Resources/Raw 下)。 */
  path: string;
  /** 目标目录(默认 'cache')。 */
  targetDirectory?: BundleTargetDirectory;
  /** 目标文件名(默认与源文件同名)。 */
  fileName?: string;
}

/** copyBundleFile() 结果。 */
export interface CopyBundleFileResult {
  /** 复制后的文件绝对路径。 */
  path: string;
}

/** 文件类型过滤(对应 MAUI FilePickerFileType 内置预设)。 */
export type PickFileType = 'any' | 'images' | 'videos';

/** pickFile() / pickFiles() 参数。 */
export interface PickFileOptions {
  /** 选择器标题(Windows 上不会显示)。 */
  title?: string;
  /** 文件类型过滤(默认 'any' 不过滤)。 */
  types?: PickFileType;
}

/** 选取到的文件。 */
export interface PickedFile {
  /** 文件名。 */
  name: string;
  /** 平台可用时的物理路径(不可依赖,内容请使用 data)。 */
  path?: string;
  /** 文件大小(字节)。 */
  size: number;
  /** base64 编码的文件内容。 */
  data: string;
}

export interface FilesystemPlugin {
  /** 获取缓存目录与应用数据目录的路径。 */
  getDirectoryPaths(): Promise<DirectoryPaths>;
  /** 读取应用包内捆绑文件的文本内容(Resources/Raw 下)。 */
  readBundleFile(options: ReadBundleFileOptions): Promise<BundleFileResult>;
  /** 将应用包内捆绑文件复制到缓存目录或数据目录。 */
  copyBundleFile(options: CopyBundleFileOptions): Promise<CopyBundleFileResult>;
  /** 打开系统文件选择器选取单个文件(取消返回 null)。 */
  pickFile(options?: PickFileOptions): Promise<PickedFile | null>;
  /** 打开系统文件选择器选取多个文件(取消返回空数组)。 */
  pickFiles(options?: PickFileOptions): Promise<PickedFile[]>;
}
