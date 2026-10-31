# @napacitor/file-viewer

文件查看器插件(与 [@capacitor/file-viewer](https://capacitorjs.com/docs/apis/file-viewer) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/file-viewer
```

To use yarn:

```bash
yarn add @napacitor/file-viewer
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { FileViewer } from '@napacitor/file-viewer';

// 本地绝对路径
await FileViewer.openDocumentFromLocalPath({ path: '/storage/emulated/0/Download/sample.pdf' });

// 应用包内资源(Resources/Raw 下的相对路径)
await FileViewer.openDocumentFromResources({ path: 'docs/sample.pdf' });

// 远程文件(交由系统浏览器/下载器处理)
await FileViewer.openDocumentFromUrl({ url: 'https://example.com/sample.pdf' });
```

## 实现原理

封装 .NET MAUI 的 [`Launcher.Default.OpenAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/launcher) 与 [`FileSystem`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/file-system-helpers) 文档所述 API:以 `OpenFileRequest + ReadOnlyFile` 交给系统查看器(Android:`Intent.ACTION_VIEW` / Windows:系统默认打开方式)。资源文件经 `FileSystem.Current.OpenAppPackageFileAsync` 读出后复制到缓存目录再交给查看器(打包资源无法直接以文件路径形式提供给外部查看器)。

## 权限

### Android

无需额外配置。读取 `path` 指向的文件需应用自身有对应存储访问权限(如 READ_EXTERNAL_STORAGE,取决于目标文件位置)。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### openDocumentFromLocalPath(options)

打开本地文件系统中的文件(需设备上存在可处理该类型的查看器;文件不存在时抛 `INVALID_ARGUMENTS`)。

| Param       | Type                      |
| ----------- | ------------------------- |
| **`options`** | `OpenFromLocalPathOptions` |

**Returns:** `Promise<void>`

### openDocumentFromResources(options)

打开应用包内资源文件(复制到缓存目录后交给系统查看器;资源不存在时抛 `INVALID_ARGUMENTS`)。

| Param       | Type                         |
| ----------- | ---------------------------- |
| **`options`** | `OpenFromResourcesOptions` |

**Returns:** `Promise<void>`

### openDocumentFromUrl(options)

打开远程文件(交由系统处理;URL 非法时抛 `INVALID_ARGUMENTS`)。

| Param       | Type                |
| ----------- | ------------------- |
| **`options`** | `OpenFromUrlOptions` |

**Returns:** `Promise<void>`

## Interfaces

### OpenFromLocalPathOptions

| Prop       | Type     | Description                                        |
| ---------- | -------- | -------------------------------------------------- |
| **`path`** | `string` | 文件的绝对路径(不能为空,否则抛 `INVALID_ARGUMENTS`)。 |

### OpenFromResourcesOptions

| Prop       | Type     | Description                                                                    |
| ---------- | -------- | ------------------------------------------------------------------------------ |
| **`path`** | `string` | 应用包内资源的相对路径(MAUI `Resources/Raw` 下,如 'docs/sample.pdf')。          |

### OpenFromUrlOptions

| Prop      | Type     | Description                                                                                          |
| --------- | -------- | ---------------------------------------------------------------------------------------------------- |
| **`url`** | `string` | 指向文件的远程地址。由系统浏览器/下载器接管,不会自动下载后弹出文档查看器(如需该语义请先经 HTTP 下载到本地再调用 `openDocumentFromLocalPath`)。 |
