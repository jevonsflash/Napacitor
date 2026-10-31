/**
 * @napacitor/camera 类型定义。
 * 拍照 / 录像 / 从媒体库选取照片与视频
 * (封装 MAUI MediaPicker API)。
 */

/** 选取或拍摄到的媒体文件。 */
export interface MediaFile {
  /** 文件名。 */
  name: string;
  /** 平台可用时的物理路径(不可依赖,内容请使用 data)。 */
  path?: string;
  /** 文件大小(字节)。 */
  size: number;
  /** 媒体内容类型(如 'image/jpeg'),平台可用时返回。 */
  contentType?: string;
  /** base64 编码的文件内容。 */
  data: string;
}

/** pickPhotos() / pickVideos() / capturePhoto() / captureVideo() 参数(对应 MAUI MediaPickerOptions)。 */
export interface PickMediaOptions {
  /** 选择器标题(仅部分操作系统显示)。 */
  title?: string;
  /** 选择数量上限(默认 1;0 表示不限制;Android 部分选择器 UI 不强制该限制,Windows 不支持)。 */
  selectionLimit?: number;
  /** 图像处理:最大宽度(像素,超出按比例缩放)。 */
  maximumWidth?: number;
  /** 图像处理:最大高度(像素,超出按比例缩放)。 */
  maximumHeight?: number;
  /** 图像处理:压缩质量 0-100(仅对支持的图像格式生效)。 */
  compressionQuality?: number;
  /** 图像处理:是否按 EXIF 方向旋转图像(默认 true)。 */
  rotateImage?: boolean;
  /** 图像处理:是否保留图像元数据。 */
  preserveMetaData?: boolean;
}

export interface CameraPlugin {
  /** 设备是否支持拍照 / 录像。 */
  isCaptureSupported(): Promise<boolean>;
  /** 打开媒体浏览器选取一张或多张照片(取消返回空数组)。 */
  pickPhotos(options?: PickMediaOptions): Promise<MediaFile[]>;
  /** 打开媒体浏览器选取一个或多个视频(取消返回空数组)。 */
  pickVideos(options?: PickMediaOptions): Promise<MediaFile[]>;
  /** 打开相机拍摄照片(取消返回 null)。 */
  capturePhoto(options?: PickMediaOptions): Promise<MediaFile | null>;
  /** 打开相机拍摄视频(取消返回 null)。 */
  captureVideo(options?: PickMediaOptions): Promise<MediaFile | null>;
}
