# @napacitor/app-info

应用信息插件,封装 .NET MAUI [`AppInfo`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/app-information) 与 [`VersionTracking`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/version-tracking) API:获取应用名称、版本、主题、版本跟踪等。

## 安装方式

To use npm:

```bash
npm install @napacitor/app-info
```

To use yarn:

```bash
yarn add @napacitor/app-info
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { AppInfo } from '@napacitor/app-info';

// 获取应用信息
const info = await AppInfo.getInfo();
console.log(info.name, info.version, info.build, info.theme);

// 获取版本跟踪信息
const vt = await AppInfo.getVersionTracking();
console.log('首次安装:', vt.isFirstLaunchEver);
console.log('当前版本首次启动:', vt.isFirstLaunchForCurrentVersion);
console.log('版本历史:', vt.versionHistory);

// 显示应用信息对话框(部分平台)
await AppInfo.showSettingsUI();

// 打开应用系统设置
await AppInfo.openSettings();
```

## 实现原理

封装 .NET MAUI 的 [`AppInfo.Current`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/app-information) 与 [`VersionTracking.Default`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/version-tracking) 门面。`getVersionTracking()` 会先调用 `Track()` 确保计数正确;`requestedLayoutOrientation` 经 `DeviceDisplay.Current.MainDisplayInfo.Orientation` 读取;`openSettings()` 映射 `AppInfo.Current.ShowSettingsUI()`。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### getInfo()

获取应用信息。

**Returns:** `Promise<AppInfoData>`

### getVersionTracking()

获取版本跟踪信息(首次调用时自动 `Track()`)。

**Returns:** `Promise<VersionTrackingData>`

### showSettingsUI()

显示应用信息对话框。MAUI 无内置 ShowSettingsUI,当前平台无内置设置 UI 时为扩展点空操作。

**Returns:** `Promise<void>`

### openSettings()

打开应用系统设置页面(映射 `AppInfo.Current.ShowSettingsUI()`)。

**Returns:** `Promise<void>`

## Interfaces

### AppInfoData

| Prop                           | Type     | Description                                                              |
| ------------------------------ | -------- | ------------------------------------------------------------------------ |
| **`name`**                     | `string` | 应用名称(显示名)。                                                       |
| **`id`**                       | `string` | 包名(Android) / Bundle ID(iOS) / 应用 ID(Windows)。                      |
| **`version`**                  | `string` | 版本号(如 1.2.3)。                                                       |
| **`build`**                    | `string` | 构建号(如 100)。                                                         |
| **`theme`**                    | `string` | 主题模式:`light` / `dark` / `system`。                                   |
| **`requestedLayoutOrientation`** | `string` | 请求布局方向:`portrait` / `landscape` / `unspecified`。                 |

### VersionTrackingData

| Prop                                  | Type       | Description                       |
| ------------------------------------- | ---------- | --------------------------------- |
| **`currentVersion`**                  | `string`   | 当前版本号。                      |
| **`currentBuild`**                    | `string`   | 当前构建号。                      |
| **`isFirstLaunchEver`**               | `boolean`  | 是否为首次安装。                  |
| **`isFirstLaunchForCurrentVersion`**  | `boolean`  | 是否为当前版本首次启动。          |
| **`isFirstLaunchForCurrentBuild`**    | `boolean`  | 是否为当前构建首次启动。          |
| **`previousVersion`**                 | `string`   | 上一个版本号。                    |
| **`previousBuild`**                   | `string`   | 上一个构建号。                    |
| **`versionHistory`**                  | `string[]` | 历史版本列表(由新到旧)。          |
| **`buildHistory`**                    | `string[]` | 历史构建列表(由新到旧)。          |
