# @napacitor/share

系统分享插件(与 [@capacitor/share](https://github.com/ionic-team/capacitor-plugins/tree/main/share) 对应)。

## 用法

```ts
import { Share } from '@napacitor/share';

await Share.share({
  title: 'Napacitor',
  text: '看看这个项目',
  url: 'https://example.com',
  dialogTitle: '分享到',
});

const { canShare } = await Share.canShare();
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Share`,运行时反射自动发现)

原生实现映射:`Share.Default.RequestAsync(ShareTextRequest)`,
其中 `title → Subject`、`dialogTitle → Title`、`text/uri → Text/Uri`。
MAUI 各目标平台均支持分享,`canShare()` 恒返回 `true`。
