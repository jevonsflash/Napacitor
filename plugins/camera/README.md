# @napacitor/camera

相机与媒体插件:拍照、录像,以及从媒体库选取照片和视频(封装 .NET MAUI [`MediaPicker`](https://learn.microsoft.com/dotnet/maui/platform-integration/device-media/picker) API)。

## 安装方式

To use npm:

```bash
npm install @napacitor/camera
```

To use yarn:

```bash
yarn add @napacitor/camera
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Camera } from '@napacitor/camera';

// 设备是否支持拍照 / 录像
const supported = await Camera.isCaptureSupported();

// ── 拍照 / 录像(取消返回 null)─────────────────────────────
const photo = await Camera.capturePhoto({ title: '拍一张' });
if (photo) {
  console.log(photo.name, photo.size, photo.contentType);
  // photo.data 为 base64 内容,可直接用于上传 / 预览
}

const video = await Camera.captureVideo();

// ── 从媒体库选取(取消返回 [])──────────────────────────────
// 单选(默认 selectionLimit = 1)
const [single] = await Camera.pickPhotos();
if (single) {
  console.log(single.name);
}

// 多选与图像处理(对应 MAUI MediaPickerOptions)
const photos = await Camera.pickPhotos({
  title: '选择照片',
  selectionLimit: 9,
  maximumWidth: 1024,
  maximumHeight: 768,
  compressionQuality: 85,
});

const videos = await Camera.pickVideos({ selectionLimit: 3 });
```

## 实现原理

封装 .NET MAUI 的 [`MediaPicker.Default`](https://learn.microsoft.com/dotnet/maui/platform-integration/device-media/picker) 门面:`capturePhoto()` / `captureVideo()` 调 `CapturePhotoAsync` / `CaptureVideoAsync`(返回 `FileResult?`,取消为 `null`);`pickPhotos()` / `pickVideos()` 调 .NET 10 的 `PickPhotosAsync` / `PickVideosAsync`(返回列表,单选设置 `SelectionLimit = 1`,取消返回空列表);`isCaptureSupported()` 取 `IsCaptureSupported`。所有方法都在 UI 线程调用(MAUI 官方要求,权限检查与请求由 MAUI 自动处理),随后把每个 `FileResult` 的流读入内存,以 base64 形式回传 JS;`FullPath` 仅在平台提供时附带回传(不保证是物理路径)。

## 权限

### Android

在 *Platforms/Android/AndroidManifest.xml* 中添加:

```xml
<!-- Needed for Picking photo/video -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

<!-- Needed for Taking photo/video -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

目标版本为 Android 11(API 30)及以上时,还需添加包可见性声明:

```xml
<queries>
  <intent>
    <action android:name="android.media.action.IMAGE_CAPTURE" />
  </intent>
</queries>
```

也可改为在 *Platforms/Android/MainApplication.cs* 中通过 `[assembly: UsesPermission(...)]` 程序集属性声明。

### iOS

在 *Platforms/iOS/Info.plist* 中添加(文案为申请权限时向用户展示的原因):

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to the camera to take photos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for taking videos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>This app needs access to the photo gallery for picking photos and videos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photos gallery for picking photos and videos.</string>
```

### Windows

无需额外配置。

## API

### isCaptureSupported()

设备是否支持拍照 / 录像。

**Returns:** `Promise<boolean>`

### pickPhotos(options?)

打开媒体浏览器选取一张或多张照片;用户取消时返回 `[]`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickMediaOptions` |

**Returns:** `Promise<MediaFile[]>`

### pickVideos(options?)

打开媒体浏览器选取一个或多个视频;用户取消时返回 `[]`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickMediaOptions` |

**Returns:** `Promise<MediaFile[]>`

### capturePhoto(options?)

打开相机拍摄照片;用户取消时返回 `null`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickMediaOptions` |

**Returns:** `Promise<MediaFile | null>`

### captureVideo(options?)

打开相机拍摄视频;用户取消时返回 `null`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickMediaOptions` |

**Returns:** `Promise<MediaFile | null>`

## Interfaces

### MediaFile

| Prop             | Type     | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| **`name`**       | `string` | 文件名。                                           |
| **`path`**       | `string` | 平台可用时的物理路径(不可依赖,内容请使用 `data`)。 |
| **`size`**       | `number` | 文件大小(字节)。                                   |
| **`contentType`** | `string` | 媒体内容类型(如 'image/jpeg'),平台可用时返回。    |
| **`data`**       | `string` | base64 编码的文件内容。                            |

### PickMediaOptions

| Prop                    | Type      | Description                                                                 |
| ----------------------- | --------- | --------------------------------------------------------------------------- |
| **`title`**             | `string`  | 选择器标题(仅部分操作系统显示)。                                            |
| **`selectionLimit`**    | `number`  | 选择数量上限(默认 `1`;`0` 表示不限制;Android 部分选择器 UI 不强制该限制,Windows 不支持)。 |
| **`maximumWidth`**      | `number`  | 图像处理:最大宽度(像素,超出按比例缩放)。                                   |
| **`maximumHeight`**     | `number`  | 图像处理:最大高度(像素,超出按比例缩放)。                                   |
| **`compressionQuality`** | `number` | 图像处理:压缩质量 0-100(仅对支持的图像格式生效)。                          |
| **`rotateImage`**       | `boolean` | 图像处理:是否按 EXIF 方向旋转图像(默认 `true`)。                           |
| **`preserveMetaData`**  | `boolean` | 图像处理:是否保留图像元数据。                                               |
