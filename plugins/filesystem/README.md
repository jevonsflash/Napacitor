# @napacitor/filesystem

文件系统插件:查询应用目录、读取与复制捆绑文件,以及打开系统文件选择器(封装 .NET MAUI [`FileSystem`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/file-system-helpers) 与 [`FilePicker`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/file-picker) API)。

## 安装方式

To use npm:

```bash
npm install @napacitor/filesystem
```

To use yarn:

```bash
yarn add @napacitor/filesystem
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Filesystem } from '@napacitor/filesystem';

// ── 目录路径(FileSystem helpers)────────────────────────────
const { cacheDirectory, dataDirectory } = await Filesystem.getDirectoryPaths();
console.log(cacheDirectory, dataDirectory);

// ── 捆绑文件(Resources/Raw 下的相对路径)─────────────────────
const { data } = await Filesystem.readBundleFile({ path: 'config/settings.json' });
console.log(data); // 文件文本内容

// 复制捆绑文件到数据目录(默认复制到缓存目录)
const { path } = await Filesystem.copyBundleFile({
  path: 'docs/sample.pdf',
  targetDirectory: 'data',
});
console.log(path);

// ── 系统文件选择器(FilePicker)───────────────────────────────
// 选取单个文件(用户取消时返回 null)
const file = await Filesystem.pickFile({ types: 'images' });
if (file) {
  console.log(file.name, file.size, file.path);
  // file.data 为 base64 内容,可直接用于上传 / 预览
}

// 选取多个文件(用户取消时返回 [])
const files = await Filesystem.pickFiles({ title: '选择附件', types: 'any' });
for (const f of files) {
  console.log(f.name, f.size);
}
```

## 实现原理

封装 .NET MAUI 的 [`FileSystem.Current`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/file-system-helpers) 与 [`FilePicker.Default`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/file-picker) 门面:`getDirectoryPaths()` 取 `CacheDirectory` / `AppDataDirectory`;`readBundleFile()` 经 `OpenAppPackageFileAsync` 读 `Resources/Raw` 下的捆绑资源并以 UTF-8 文本返回;`copyBundleFile()` 把捆绑资源流复制到缓存/数据目录(打包资源无法直接以文件路径访问,只能经流复制落地)。`pickFile()` / `pickFiles()` 在 UI 线程调用 `PickAsync` / `PickMultipleAsync`(MAUI 官方要求),随后把每个 `FileResult` 的流读入内存,以 base64 形式回传 JS;`FullPath` 仅在平台提供时附带回传(不保证是物理路径)。

## 权限

### Android

无需额外配置(文件选择器经系统 Storage Access Framework 完成,`FileResult` 内容由系统 URI 授权读取)。读取本地任意路径不在本插件范围内。

### iOS

无需额外配置。

### Windows

无需额外配置。`PickOptions.PickerTitle` 在 Windows 上不会显示。

## API

### getDirectoryPaths()

获取缓存目录与应用数据目录的路径。

**Returns:** `Promise<DirectoryPaths>`

### readBundleFile(options)

读取应用包内捆绑文件的文本内容(UTF-8;资源不存在时抛 `INVALID_ARGUMENTS`)。

| Param       | Type                     |
| ----------- | ------------------------ |
| **`options`** | `ReadBundleFileOptions` |

**Returns:** `Promise<BundleFileResult>`

### copyBundleFile(options)

将应用包内捆绑文件复制到缓存目录或数据目录(资源不存在时抛 `INVALID_ARGUMENTS`)。

| Param       | Type                    |
| ----------- | ----------------------- |
| **`options`** | `CopyBundleFileOptions` |

**Returns:** `Promise<CopyBundleFileResult>`

### pickFile(options?)

打开系统文件选择器选取单个文件;用户取消时返回 `null`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickFileOptions` |

**Returns:** `Promise<PickedFile | null>`

### pickFiles(options?)

打开系统文件选择器选取多个文件;用户取消时返回 `[]`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `PickFileOptions` |

**Returns:** `Promise<PickedFile[]>`

## Interfaces

### DirectoryPaths

| Prop                 | Type     | Description                                    |
| -------------------- | -------- | ---------------------------------------------- |
| **`cacheDirectory`** | `string` | 缓存目录(系统可能清理,勿存放关键数据)。        |
| **`dataDirectory`**  | `string` | 应用数据目录(随系统备份同步)。                 |

### ReadBundleFileOptions

| Prop       | Type     | Description                                                  |
| ---------- | -------- | ------------------------------------------------------------ |
| **`path`** | `string` | 应用包内资源路径(MAUI `Resources/Raw` 下,如 'config/settings.json')。 |

### BundleFileResult

| Prop       | Type     | Description              |
| ---------- | -------- | ------------------------ |
| **`data`** | `string` | 文件文本内容(UTF-8)。    |

### CopyBundleFileOptions

| Prop                  | Type                   | Description                              |
| --------------------- | ---------------------- | ---------------------------------------- |
| **`path`**            | `string`               | 应用包内资源路径(`Resources/Raw` 下)。   |
| **`targetDirectory`** | `'cache' \| 'data'`    | 目标目录(默认 `'cache'`)。               |
| **`fileName`**        | `string`               | 目标文件名(默认与源文件同名)。           |

### CopyBundleFileResult

| Prop       | Type     | Description              |
| ---------- | -------- | ------------------------ |
| **`path`** | `string` | 复制后的文件绝对路径。   |

### PickFileOptions

| Prop        | Type                              | Description                                          |
| ----------- | --------------------------------- | ---------------------------------------------------- |
| **`title`** | `string`                          | 选择器标题(Windows 上不会显示)。                     |
| **`types`** | `'any' \| 'images' \| 'videos'`   | 文件类型过滤(默认 `'any'` 不过滤)。                  |

### PickedFile

| Prop       | Type     | Description                                                    |
| ---------- | -------- | -------------------------------------------------------------- |
| **`name`** | `string` | 文件名。                                                       |
| **`path`** | `string` | 平台可用时的物理路径(不可依赖,内容请使用 `data`)。             |
| **`size`** | `number` | 文件大小(字节)。                                               |
| **`data`** | `string` | base64 编码的文件内容。                                        |
