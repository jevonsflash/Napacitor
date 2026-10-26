# @napacitor/browser

内嵌浏览器插件(与 [@capacitor/browser](https://github.com/ionic-team/capacitor-plugins/tree/main/browser) 对应)。

## 用法

```ts
import { Browser } from '@napacitor/browser';

await Browser.open({ url: 'https://example.com', toolbarColor: '#3282F6' });
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Browser`,运行时反射自动发现)

原生实现映射:`Browser.Default.OpenAsync(uri, BrowserLaunchOptions)`(SystemPreferred 模式:
Android Custom Tabs / iOS SFSafariViewController / 桌面回退到外部浏览器)。

## 与 Capacitor 的差异

- **close()**:MAUI Browser API 未提供跨平台关闭入口,原生端抛出 `NOT_IMPLEMENTED`
  (关闭 Android Custom Tabs / iOS SFSafariViewController 会话需少量平台代码);web 端
  尽力 `window.close()`(仅能关闭脚本打开的窗口);
- **browserFinished / browserPageLoaded 事件**:需监听 Custom Tabs 回调 /
  SFSafariViewController 委托,当前原生端不派发(注册监听器时输出调试提示);
- **toolbarColor**:非法颜色串按平台默认工具栏色处理;**windowName / presentationStyle /
  width / height** 仅 web / iOS 生效,其余平台忽略。
