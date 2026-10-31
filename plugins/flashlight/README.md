# @napacitor/flashlight

手电筒控制插件,封装 .NET MAUI [`Flashlight`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/flashlight) API。

## 安装方式

To use npm:

```bash
npm install @napacitor/flashlight
```

To use yarn:

```bash
yarn add @napacitor/flashlight
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Flashlight } from '@napacitor/flashlight';

// 检查是否支持
const { supported } = await Flashlight.isSupported();

if (supported) {
  // 打开手电筒
  await Flashlight.switchOn({ intensity: 0.8 });

  // 查询状态
  const { isOn } = await Flashlight.getState();

  // 切换状态
  await Flashlight.toggle();

  // 关闭手电筒
  await Flashlight.switchOff();
}
```

## 实现原理

封装 .NET MAUI 的 [`Flashlight.Default.TurnOnAsync / TurnOffAsync / IsSupportedAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/flashlight) 门面(Android 用 Torch Mode / iOS 用 `AVCaptureDevice` / Windows 用 `Lamp` API)。`_isOn` 状态由插件自行维护(MAUI 无状态查询),`toggle()` 依据该状态切换。不支持手电筒的平台(如 Windows 桌面)抛出 `UNSUPPORTED`。注意:`intensity` 仅部分平台支持,当前原生端忽略(MAUI API 无亮度参数)。

## 权限

### Android

需声明 `FLASHLIGHT` 与 `CAMERA` 权限(MAUI 文档要求)。在 `AndroidManifest.xml` 添加:

```xml
<uses-permission android:name="android.permission.FLASHLIGHT" />
<uses-permission android:name="android.permission.CAMERA" />
```

或在 `Platforms/Android/MainApplication.cs` 添加程序集特性:

```csharp
[assembly: UsesPermission(Android.Manifest.Permission.Flashlight)]
[assembly: UsesPermission(Android.Manifest.Permission.Camera)]
```

为避免 Google Play 自动过滤无相机设备,可再声明硬件特性为可选:

```csharp
[assembly: UsesFeature("android.hardware.camera", Required = false)]
```

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### isSupported()

检查当前设备是否支持手电筒。

**Returns:** `Promise<FlashlightSupportedResult>`

### switchOn(options?)

打开手电筒(设备不支持时抛 `UNSUPPORTED`)。

| Param       | Type                |
| ----------- | ------------------- |
| **`options`** | `FlashlightOptions` |

**Returns:** `Promise<void>`

### switchOff()

关闭手电筒(设备不支持时抛 `UNSUPPORTED`)。

**Returns:** `Promise<void>`

### toggle(options?)

切换手电筒状态(开 → 关 / 关 → 开)。

| Param       | Type                |
| ----------- | ------------------- |
| **`options`** | `FlashlightOptions` |

**Returns:** `Promise<void>`

### getState()

查询手电筒当前状态(由插件维护的 `_isOn` 状态,非系统查询)。

**Returns:** `Promise<FlashlightStateResult>`

## Interfaces

### FlashlightOptions

| Prop            | Type     | Description                                                                |
| --------------- | -------- | -------------------------------------------------------------------------- |
| **`intensity`** | `number` | 亮度级别(0.0 - 1.0);仅部分平台支持,默认 `1.0`。当前原生端忽略(MAUI API 无亮度参数)。 |

### FlashlightStateResult

| Prop        | Type      | Description        |
| ----------- | --------- | ------------------ |
| **`isOn`**  | `boolean` | 手电筒是否当前开启。 |

### FlashlightSupportedResult

| Prop            | Type      | Description              |
| --------------- | --------- | ------------------------ |
| **`supported`** | `boolean` | 当前设备是否支持手电筒。 |
