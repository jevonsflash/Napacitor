# @napacitor/battery

电量与充电状态插件(与 [@capacitor/battery](https://github.com/ionic-team/capacitor-plugins/tree/main/battery) 对应)。

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

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Battery`,运行时反射自动发现)

原生实现映射:`Battery.Default.ChargeLevel / PowerSource / BatteryInfoChanged`。
本插件是 Napacitor 事件管线的参考实现:首个 JS 监听器注册时(`OnListenerAdded`)
订阅原生 `BatteryInfoChanged`,最后一个监听器移除时(`OnListenerRemoved`)退订,
状态变化经 `NotifyListeners('batteryStatusChange', …)` 推送。
