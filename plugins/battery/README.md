# @napacitor/battery

电量与充电状态插件(与 [@capacitor/battery](https://github.com/ionic-team/capacitor-plugins/tree/main/battery) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/battery
```

To use yarn:

```bash
yarn add @napacitor/battery
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Battery } from '@napacitor/battery';

const info = await Battery.getBatteryInfo();
// { batteryLevel: 0.85, isCharging: false }

// 事件监听(原生端按需订阅,最后一个监听器移除后退订)
const handle = await Battery.addListener('batteryStatusChange', (info) => {
  console.log(info.batteryLevel, info.isCharging);
});

await handle.remove();
await Battery.removeAllListeners();
```

## 实现原理

封装 .NET MAUI 的 [`Battery`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/battery) 文档所述 API:`Battery.Default.ChargeLevel / PowerSource / BatteryInfoChanged`(电源非电池即视为充电中)。本插件是 Napacitor 事件管线的参考实现:首个 JS 监听器注册时(`OnListenerAdded`)订阅原生 `BatteryInfoChanged`,最后一个监听器移除时(`OnListenerRemoved`)退订,状态变化经 `NotifyListeners('batteryStatusChange', …)` 推送。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### getBatteryInfo()

获取当前电池信息。

**Returns:** `Promise<BatteryInfo>`

### addListener('batteryStatusChange', callback)

监听电池状态变化(电量 / 充电状态)。首个监听器注册时订阅原生事件,最后一个移除后退订。

| Param        | Type                           |
| ------------ | ------------------------------ |
| **`eventName`** | `'batteryStatusChange'`      |
| **`callback`**  | `BatteryChangeCallback`      |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### BatteryInfo

| Prop               | Type      | Description                                            |
| ------------------ | --------- | ------------------------------------------------------ |
| **`batteryLevel`** | `number`  | 电量(0.0 - 1.0,原生值经 `Math.Clamp` 归一)。          |
| **`isCharging`**   | `boolean` | 是否正在充电(电源非电池即视为充电中)。                |
