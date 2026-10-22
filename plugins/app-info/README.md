# @napacitor/app-info

应用信息插件,封装 .NET MAUI `AppInfo` 与 `VersionTracking` API:获取应用名称、版本、主题、版本跟踪等。

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

// 打开应用系统设置
await AppInfo.openSettings();
```

## API

### getInfo()

获取应用信息。

**返回:** `Promise<AppInfoData>`

| 字段 | 类型 | 说明 |
|------|------|------|
| name | `string` | 应用名称 |
| id | `string` | 包名 / Bundle ID |
| version | `string` | 版本号 |
| build | `string` | 构建号 |
| theme | `string` | 主题模式:`light` / `dark` / `system` |
| requestedLayoutOrientation | `string` | 请求布局方向 |

### getVersionTracking()

获取版本跟踪信息。

**返回:** `Promise<VersionTrackingData>`

| 字段 | 类型 | 说明 |
|------|------|------|
| currentVersion | `string` | 当前版本号 |
| currentBuild | `string` | 当前构建号 |
| isFirstLaunchEver | `boolean` | 是否为首次安装 |
| isFirstLaunchForCurrentVersion | `boolean` | 是否为当前版本首次启动 |
| isFirstLaunchForCurrentBuild | `boolean` | 是否为当前构建首次启动 |
| previousVersion | `string` | 上一个版本号 |
| previousBuild | `string` | 上一个构建号 |
| versionHistory | `string[]` | 历史版本列表 |
| buildHistory | `string[]` | 历史构建列表 |

### openSettings()

打开应用系统设置页面。

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.AppInfo`)

原生实现映射:`AppInfo.Current` + `VersionTracking.Default` + `AppInfo.Current.ShowSettingsUI()`。
