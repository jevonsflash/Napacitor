# @napacitor/app-launcher

应用启动器插件,封装 .NET MAUI [`Launcher`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/launcher) 与 [`Map`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/maps) API:打开其他应用、URL、系统地图。

## 安装方式

To use npm:

```bash
npm install @napacitor/app-launcher
```

To use yarn:

```bash
yarn add @napacitor/app-launcher
```

Sync native files:

```bash
npx nap sync
```

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

## 实现原理

封装 .NET MAUI 的 [`Launcher.Default.OpenAsync / CanOpenAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/launcher) 与 [`Map.Default.OpenAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/maps) 门面。`openApp` / `canOpenApp` 以 `<appId>://` 形式构造 URI 后走 `Launcher`;`openMap` 把 `label` 映射 `MapLaunchOptions.Name`、`navigationMode` 映射 `NavigationMode`(driving / walking / transit,其余为 `None`)。

## 权限

### Android

无需额外配置。`openUrl` 支持 `http/https/mailto/tel/geo` 等协议。

### iOS

无需额外配置。若需检测第三方应用自定义 scheme 是否可打开,可在 `Info.plist` 声明 `LSApplicationQueriesSchemes`(受 iOS 查询数量限制)。

### Windows

无需额外配置。

## API

### openUrl(options)

打开 URL(由系统浏览器或对应应用处理)。URL 必须为合法绝对地址,否则抛 `INVALID_ARGUMENTS`;平台报告无法处理时仍尝试打开(部分平台检测不准)。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `OpenUrlOptions` |

**Returns:** `Promise<void>`

### canOpenUrl(options)

检查当前平台是否能处理该 URL(URL 非法时返回 `false`)。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `OpenUrlOptions` |

**Returns:** `Promise<CanOpenUrlResult>`

### openApp(options)

通过包名 / 应用 ID 打开应用(以 `<appId>://` 形式尝试打开,平台无法处理时抛 `UNSUPPORTED`)。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `OpenAppOptions` |

**Returns:** `Promise<void>`

### canOpenApp(options)

检查是否安装了指定应用(检测异常时返回 `false`)。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `OpenAppOptions` |

**Returns:** `Promise<CanOpenAppResult>`

### openMap(options)

打开系统地图并定位到指定坐标。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `OpenMapOptions` |

**Returns:** `Promise<void>`

## Interfaces

### OpenUrlOptions

| Prop      | Type     | Description                                            |
| --------- | -------- | ------------------------------------------------------ |
| **`url`** | `string` | 要打开的 URL(支持 http/https/mailto/tel/geo 等协议)。 |

### OpenAppOptions

| Prop        | Type     | Description                                  |
| ----------- | -------- | -------------------------------------------- |
| **`appId`** | `string` | Android 包名 / iOS Bundle ID / Windows 应用协议。 |

### CanOpenUrlResult

| Prop           | Type      | Description                  |
| -------------- | --------- | ---------------------------- |
| **`canOpen`**  | `boolean` | 当前平台是否能处理该 URL。   |

### CanOpenAppResult

| Prop           | Type      | Description                      |
| -------------- | --------- | -------------------------------- |
| **`canOpen`**  | `boolean` | 当前平台是否安装了该应用。       |

### OpenMapOptions

| Prop                 | Type     | Description                                                   |
| -------------------- | -------- | ------------------------------------------------------------- |
| **`latitude`**       | `number` | 纬度。                                                        |
| **`longitude`**      | `number` | 经度。                                                        |
| **`label`**          | `string` | 地图标签(可选,映射 `MapLaunchOptions.Name`)。                 |
| **`navigationMode`** | `string` | 导航模式:`driving` / `walking` / `transit`(可选,仅部分平台支持;其余值视为 `None`)。 |
