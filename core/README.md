# @napacitor/core

Napacitor 的 **JavaScript 核心**,对应 Capacitor 仓库中 `core/`(`@capacitor/core`)的角色:提供 `registerPlugin`、全局 `Napacitor` 对象与异常类型,是全部插件包的 peer 依赖。

## 双形态设计(与 Capacitor core 同构)

| 形态 | 文件 | 运行环境 |
|---|---|---|
| **原生桥** | `dist/native-bridge.js` | MAUI BlazorWebView 中由 C# 运行时 eval 注入,先于 Web 应用脚本执行;安装 `window.Napacitor`,invoke 走 `DotNet.invokeMethodAsync` |
| **web/dev 运行时** | `dist/index.js` + `dist/runtime.js` | 普通浏览器(`window.NapacitorNative` 缺失)中安装 web 运行时;invoke 分发到各插件注册的 web 实现 |

两形态 API 完全同形(`getPlatform / isNativePlatform / isPluginAvailable / registerPlugin / convertFileSrc`),Web 应用代码无需感知运行环境差异 —— 与 Capacitor 的 index.ts 策略一致。

## 结构

```
core/
├── src/
│   ├── index.ts           # 入口:原生复用注入的全局;浏览器安装 web 运行时
│   ├── runtime.ts         # web/dev 运行时 + registerPlugin
│   ├── native-bridge.ts   # 原生桥(零 import,独立构建,由 C# 内嵌注入)
│   └── definitions.ts     # 公共类型(registerPlugin/PluginListenerHandle/…)
├── dist/                  # 构建产物(CJS + d.ts,已提交)
├── tsconfig.json          # index/runtime/definitions 构建
├── tsconfig.native-bridge.json  # native-bridge 单独构建(无模块包装)
└── package.json
```

## 用法

```ts
import { registerPlugin, NapacitorException } from '@napacitor/core';

// 原生环境:复用注入的原生桥;浏览器:惰性加载 web 实现
const Echo = registerPlugin('Echo', {
  web: () => import('./echo-web').then((m) => new m.EchoWeb()),
});

try {
  await Echo.echo({ value: 'hi' });
} catch (err) {
  if (err instanceof NapacitorException && err.code === 'NOT_IMPLEMENTED') {
    // 平台未实现
  }
}
```

## 构建

`dist/` 为已提交的 tsc 等价产物(CJS + d.ts,兼容 Vue CLI 4 / webpack 4),可用 `npm run build` 再生成。`native-bridge.js` 由 `tsconfig.native-bridge.json` 单独构建为无模块包装的纯脚本(C# eval 注入要求)。
