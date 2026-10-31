# @napacitor/haptics

振动反馈插件(与 [@capacitor/haptics](https://github.com/ionic-team/capacitor-plugins/tree/main/haptics) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/haptics
```

To use yarn:

```bash
yarn add @napacitor/haptics
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Haptics, ImpactStyle } from '@napacitor/haptics';

await Haptics.impact({ style: ImpactStyle.Heavy });
await Haptics.notification();              // 默认 SUCCESS
await Haptics.vibrate({ duration: 100 });  // 自定义时长(毫秒)
await Haptics.selection();                 // 选择变化(轻微反馈)
await Haptics.selectionChanged();          // 选择开始(轻微反馈)
```

## 实现原理

封装 .NET MAUI 的 [`Vibration`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/vibrate) 文档所述 API:`Vibration.Default.Vibrate(TimeSpan) / IsSupported`。MAUI 无 Taptic 级别反馈,用振动时长近似:impact LIGHT 10ms / MEDIUM 25ms / HEAVY 40ms;notification SUCCESS 35ms / WARNING 45ms / ERROR 60ms;`selection` / `selectionChanged` 为 10ms 轻微反馈。不支持振动的平台(如 Windows)为无操作并记录调试日志。

## 权限

### Android

需声明 `VIBRATE` 权限(MAUI 文档要求)。在 `AndroidManifest.xml` 添加:

```xml
<uses-permission android:name="android.permission.VIBRATE" />
```

或在 `Platforms/Android/MainApplication.cs` 添加程序集特性:

```csharp
[assembly: UsesPermission(Android.Manifest.Permission.Vibrate)]
```

### iOS

无需额外配置。注意:仅设备设为"响铃时振动"才振动;总是振动 500ms;无法取消振动。

### Windows

无需额外配置。桌面平台不支持振动,调用为无操作并记录调试日志。

## API

### impact(options?)

触觉冲击(默认 MEDIUM)。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `ImpactOptions` |

**Returns:** `Promise<void>`

### notification(options?)

通知触觉(默认 SUCCESS)。

| Param       | Type                  |
| ----------- | --------------------- |
| **`options`** | `NotificationOptions` |

**Returns:** `Promise<void>`

### vibrate(options?)

自定义时长振动(默认 60ms)。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `VibrateOptions` |

**Returns:** `Promise<void>`

### selection()

选择变化触觉(轻微,10ms)。

**Returns:** `Promise<void>`

### selectionChanged()

选择开始触觉(与 `selection` 同为轻微反馈,10ms)。

**Returns:** `Promise<void>`

## Interfaces

### ImpactOptions

| Prop        | Type          | Description                                    |
| ----------- | ------------- | ---------------------------------------------- |
| **`style`** | `ImpactStyle` | 触觉强度:`LIGHT`(10ms) / `MEDIUM`(25ms) / `HEAVY`(40ms);默认 `MEDIUM`。未知值按 25ms 处理。 |

### NotificationOptions

| Prop       | Type               | Description                                                                      |
| ---------- | ------------------ | -------------------------------------------------------------------------------- |
| **`type`** | `NotificationType` | 通知类型:`SUCCESS`(35ms) / `WARNING`(45ms) / `ERROR`(60ms);默认 `SUCCESS`。未知值按 35ms 处理。 |

### VibrateOptions

| Prop           | Type     | Description              |
| -------------- | -------- | ------------------------ |
| **`duration`** | `number` | 振动时长(毫秒,默认 60)。 |
