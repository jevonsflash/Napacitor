# @napacitor/haptics

振动反馈插件(与 [@capacitor/haptics](https://github.com/ionic-team/capacitor-plugins/tree/main/haptics) 对应)。

## 用法

```ts
import { Haptics, ImpactStyle } from '@napacitor/haptics';

await Haptics.impact({ style: ImpactStyle.Heavy });
await Haptics.notification();              // 默认 SUCCESS
await Haptics.vibrate({ duration: 100 });  // 自定义时长(毫秒)
await Haptics.selection();                 // 轻微反馈
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Haptics`,运行时反射自动发现)

原生实现映射:`Vibration.Default.Vibrate(TimeSpan) / IsSupported`。
MAUI 无 Taptic 级别反馈,用振动时长近似:LIGHT 10ms / MEDIUM 25ms / HEAVY 40ms;
notification SUCCESS 35ms / WARNING 45ms / ERROR 60ms。不支持振动的平台
(如 Windows)为无操作并记录调试日志。
