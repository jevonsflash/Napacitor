# @napacitor/app-launcher

应用启动器插件,封装 .NET MAUI `Launcher` 与 `Map` API:打开其他应用、URL、系统地图。

## 用法

```ts
import { AppLauncher } from '@napacitor/app-launcher';

// 打开 URL
await AppLauncher.openUrl({ url: 'https://example.com' });

// 检查是否能处理该 URL
const { canOpen } = await AppLauncher.canOpenUrl({ url: 'tel:1234567890' });

// 通过包名打开应用
await AppLauncher.openApp({ appId: 'com.example.app' });

// 检查是否安装了指定应用
const { canOpen: appInstalled } = await AppLauncher.canOpenApp({ appId: 'com.example.app' });

// 打开系统地图
await AppLauncher.openMap({
  latitude: 39.9042,
  longitude: 116.4074,
  label: '北京',
  navigationMode: 'driving',
});
```

## API

### openUrl(options)

打开 URL(由系统浏览器或对应应用处理)。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.url | `string` | **必填**。要打开的 URL |

### canOpenUrl(options)

检查当前平台是否能处理该 URL。

**返回:** `Promise<{ canOpen: boolean }>`

### openApp(options)

通过包名 / 应用 ID 打开应用。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.appId | `string` | **必填**。Android 包名 / iOS Bundle ID / Windows 协议 |

### canOpenApp(options)

检查是否安装了指定应用。

**返回:** `Promise<{ canOpen: boolean }>`

### openMap(options)

打开系统地图并定位到指定坐标。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.latitude | `number` | **必填**。纬度 |
| options.longitude | `number` | **必填**。经度 |
| options.label | `string` | 地图标签 |
| options.navigationMode | `string` | 导航模式:`driving` / `walking` / `transit` |

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.AppLauncher`)

原生实现映射:`Launcher.Default.OpenAsync / CanOpenAsync` + `Map.Default.OpenAsync`。
