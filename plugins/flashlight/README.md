# @napacitor/flashlight

手电筒控制插件,封装 .NET MAUI `Flashlight` API。

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

## API

### isSupported()

检查当前设备是否支持手电筒。

**返回:** `Promise<{ supported: boolean }>`

### switchOn(options?)

打开手电筒。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options.intensity | `number` | `1.0` | 亮度级别(0.0 - 1.0);仅部分平台支持 |

### switchOff()

关闭手电筒。

### toggle(options?)

切换手电筒状态(开 → 关 / 关 → 开)。

### getState()

查询手电筒当前状态。

**返回:** `Promise<{ isOn: boolean }>`

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Flashlight`)

原生实现映射:`Flashlight.Default.TurnOnAsync / TurnOffAsync`。
