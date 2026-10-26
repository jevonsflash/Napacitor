# @napacitor/file-viewer

文件查看器插件(与 [@capacitor/file-viewer](https://capacitorjs.com/docs/apis/file-viewer) 对应)。

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

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.FileViewer`,运行时反射自动发现)

原生实现映射:`Launcher.Default.OpenAsync(OpenFileRequest + ReadOnlyFile)`
(Android:Intent.ACTION_VIEW / Windows:系统默认打开方式)。资源文件经
`FileSystem.Current.OpenAppPackageFileAsync` 读出后复制到缓存目录再交给查看器
(打包资源无法直接以文件路径形式提供给外部查看器)。

## 与 Capacitor 的差异

- **openDocumentFromUrl**:映射 `Launcher.OpenAsync(uri)`,由系统浏览器/下载器接管,
  不会自动下载后弹出文档查看器(Capacitor Android 内部先下载;如需该语义请先经
  HTTP 下载到本地再调用 openDocumentFromLocalPath);
- **previewMediaContentFrom***:Capacitor 的 iOS 专用媒体预览,MAUI 无对应跨平台 API,
  暂未实现(可先用 openDocumentFrom* 代替);
- **web**:与 Capacitor 一致,仅原生平台可用。
