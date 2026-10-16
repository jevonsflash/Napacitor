# @napacitor/clipboard

系统剪贴板插件(与 [@capacitor/clipboard](https://github.com/ionic-team/capacitor-plugins/tree/main/clipboard) 对应)。

## 用法

```ts
import { Clipboard } from '@napacitor/clipboard';

await Clipboard.write({ string: '要复制的内容' });

const result = await Clipboard.read();
console.log(result.value); // 剪贴板文本
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Clipboard`,运行时反射自动发现)

原生实现映射:`Clipboard.Default.SetTextAsync / GetTextAsync`。
图像剪贴板(`image` 参数)在 MAUI 端暂未实现,调用将抛出 `NOT_IMPLEMENTED`。
