# @napacitor/geolocation

GPS 定位与持续监听插件(与 [@capacitor/geolocation](https://github.com/ionic-team/capacitor-plugins/tree/main/geolocation) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/geolocation
```

To use yarn:

```bash
yarn add @napacitor/geolocation
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Geolocation } from '@napacitor/geolocation';

// 一次性定位
const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
});
console.log(position.coords.latitude, position.coords.longitude);

// 权限
const status = await Geolocation.checkPermissions();
await Geolocation.requestPermissions();

// 持续监听(收到 Position 或 {code, message} 错误)
const id = await Geolocation.watchPosition({}, (position, err) => {
  if (err) { console.error(err); return; }
  console.log(position?.coords);
});
await Geolocation.clearWatch({ id });
```

## 实现原理

封装 .NET MAUI 的 [`Geolocation`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/geolocation) 与 [`Permissions`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/permissions) 文档所述 API:`Geolocation.Default.GetLocationAsync`(getCurrentPosition)、`StartListeningForegroundAsync / StopListeningForegroundAsync + LocationChanged / ListeningFailed 事件`(watchPosition)。Capacitor 的回调式 watch 映射为"原生 `watchPosition` 方法 + `position` / `error` 事件管线",入口层已封装成 Capacitor 同形的 `(options, callback) => Promise<CallbackID>` 签名。MAUI Geolocation 仅支持一个前台监听会话,重复 `watchPosition` 会以新参数重启并返回新 id。权限映射 `Permissions.LocationWhenInUse`(`CheckStatusAsync` / `RequestAsync`)。

## 权限

### Android

`AndroidManifest.xml` 需声明位置权限(MAUI 文档要求):

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

建议同时声明硬件特性为可选,避免 Google Play 过滤无 GPS 设备:

```xml
<uses-feature android:name="android.hardware.location" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
<uses-feature android:name="android.hardware.location.network" android:required="false" />
```

或在 `Platforms/Android/MainApplication.cs` 添加 `[assembly: UsesPermission(...)]` 等价特性。

### iOS

`Platforms/iOS/Info.plist` 需声明 `NSLocationWhenInUseUsageDescription`(描述应用为何需要定位,缺失会导致系统直接拒绝)。Mac Catalyst 还需在 `Entitlements.plist` 启用 Location Services。

### Windows

无需额外配置。

## API

### getCurrentPosition(options?)

获取当前位置(一次性)。无法获取时抛 `ERROR`(可能权限被拒、定位服务未开启或超时)。

| Param       | Type              |
| ----------- | ----------------- |
| **`options`** | `PositionOptions` |

**Returns:** `Promise<Position>`

### watchPosition(options, callback)

持续监听位置变化;返回回调 ID(供 `clearWatch` 使用)。原生端重复调用会以新参数重启会话并返回新 id;web 环境直接走 `navigator.geolocation`(id 带 `web.` 前缀)。

| Param        | Type                    |
| ------------ | ----------------------- |
| **`options`** | `PositionOptions`       |
| **`callback`** | `WatchPositionCallback` |

**Returns:** `Promise<CallbackID>`

### clearWatch(options)

停止指定的位置监听(id 不匹配时为 no-op)。

| Param       | Type                 |
| ----------- | -------------------- |
| **`options`** | `ClearWatchOptions` |

**Returns:** `Promise<void>`

### checkPermissions()

检查定位权限(检查 `LocationWhenInUse`)。

**Returns:** `Promise<PermissionStatus>`

### requestPermissions()

请求定位权限(平台弹窗;web 平台不支持)。

**Returns:** `Promise<PermissionStatus>`

## Interfaces

### GeolocationCoords

| Prop                   | Type     | Description                                        |
| ---------------------- | -------- | -------------------------------------------------- |
| **`latitude`**         | `number` | 纬度。                                             |
| **`longitude`**        | `number` | 经度。                                             |
| **`accuracy`**         | `number` | 精度(米)。                                         |
| **`altitude`**         | `number \| null` | 海拔(米;平台未提供时为 `null`)。           |
| **`altitudeAccuracy`** | `number \| null` | 海拔精度(米;平台未提供时为 `null`)。       |
| **`heading`**          | `number \| null` | 行进方向角(0-360°;平台未提供时为 `null`)。 |
| **`speed`**            | `number \| null` | 速度(m/s;平台未提供时为 `null`)。            |

### Position

| Prop            | Type                | Description               |
| --------------- | ------------------- | ------------------------- |
| **`timestamp`** | `number`            | 创建时间戳(Unix 毫秒)。   |
| **`coords`**    | `GeolocationCoords` | 坐标与精度。              |

### PositionOptions

| Prop                    | Type      | Description                                                                                 |
| ----------------------- | --------- | ------------------------------------------------------------------------------------------- |
| **`enableHighAccuracy`** | `boolean` | 高精度模式(映射 MAUI `GeolocationAccuracy.Best`;默认 `Default`)。                          |
| **`timeout`**           | `number`  | 最大等待时长(毫秒,默认 10000;须为正数,否则抛 `INVALID_ARGUMENTS`)。                        |
| **`maximumAge`**        | `number`  | 可接受缓存位置的最大时长(毫秒)。仅 web 生效,原生端忽略。                                    |

### ClearWatchOptions

| Prop     | Type         | Description                |
| -------- | ------------ | -------------------------- |
| **`id`** | `CallbackID` | `watchPosition` 返回的回调 ID。 |

### PermissionStatus

| Prop                 | Type               | Description                                                                 |
| -------------------- | ------------------ | --------------------------------------------------------------------------- |
| **`location`**       | `PermissionState`  | 位置权限状态(`granted` / `denied` / `prompt`;检查 `LocationWhenInUse`)。    |
| **`coarseLocation`** | `PermissionState`  | 粗略位置权限状态。MAUI 未区分粒度,与 `location` 同值。                      |
