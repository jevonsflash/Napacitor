# Napacitor

[![AtomGit G-Star](https://gitcode.com/jevonsflash1/Napacitor/star/new_badge.svg)](https://gitcode.com/jevonsflash1/Napacitor)

复刻 [Capacitor](https://github.com/ionic-team/capacitor) 的跨平台运行时 —— 用一份 Web 前端代码构建真正的原生应用,但**原生抽象层不是每平台独立原生工程,而是 .NET MAUI Blazor**(BlazorWebView + JSInterop):同一份 C# 运行时覆盖 Android / iOS / Mac Catalyst / Windows。

```text
┌─────────────────────────────────────────────────────┐
│  应用工程(用户的 Web 前端项目)                        │
│  dist/(Web 构建产物)   napacitor.config.json         │
│  node_modules/@napacitor/{core,maui,device,…}        │
│                    │ nap add maui / nap sync         │
├────────────────────▼────────────────────────────────┤
│  MAUI Blazor 宿主(nap add maui 生成的 maui/ 目录)   │
│  App.csproj(多 TFM)  MainPage(BlazorWebView)        │
│  wwwroot/(nap copy 拷入的 Web 产物 + entries.json)   │
│  napacitor.build.props(nap sync 生成,接入 C# 工程)  │
├─────────────────────────────────────────────────────┤
│  Napacitor 运行时 + 插件(C#,反射自动发现)           │
│  NapacitorRuntime → eval 注入 native-bridge.js       │
│  JS ⇄ DotNet.invokeMethodAsync('Napacitor', …)       │
├─────────────────────────────────────────────────────┤
│  .NET MAUI 10(net10.0-android / -ios / -maccatalyst │
│  / -windows10.0.19041)                              │
└─────────────────────────────────────────────────────┘
```

## 目录布局(镜像 Capacitor 顶层)

| Capacitor 仓库 | Napacitor | 说明 |
|---|---|---|
| `android/` = `@capacitor/android` | `maui/` = `@napacitor/maui` | C# 运行时类库(文件即源码,镜像 android 的 files 仅含原生库源码) |
| `android-template/` | `maui-template/` | `nap add maui` 的宿主模板 |
| `core/` = `@capacitor/core` | `core/` = `@napacitor/core` | TS 核心(native-bridge + web 运行时) |
| `cli/` = `@capacitor/cli` | `cli/` = `@napacitor/cli` | `nap` 命令 |
| capacitor-plugins 仓 `plugins/<x>/` | `plugins/<x>/` | 5 个插件(device/clipboard/haptics/share/battery) |
| `capacitor.settings.gradle` / `capacitor.build.gradle` | `napacitor.build.props` | nap sync 生成的 MSBuild 工程引用 |
| `cap add/copy/sync/open/run/ls` | `nap add/copy/sync/open/run/list` | 工作流同形 |
| native-bridge.js 注入 WebView | napacitor-native-bridge.js 由 C# eval 注入 | 同一链路 |
| `lerna.json` / `nx.json` | 无 | 0.1 阶段用 npm workspaces + 根 scripts 即可 |

仓库**不含任何 .sln**(Capacitor 的 android 模块同理,均为独立工程);现有 `MAUI-Vue-Hybriddev-StandaloneHost/`、`hybird-host/` 仅作参考,不属于本仓库。

## 快速上手

> 新手入门(Starters)见 [napacitor-starters](https://github.com/jevonsflash/napacitor-starters) —— React 单页应用 + 全部内置插件演示,
> 并记录了从 `npm create vite` 到 `nap run` 的真实用户步骤复盘。

```bash
# ① 在 Web 前端项目中(与 Capacitor 工作流同形)
npm install @napacitor/core @napacitor/maui @napacitor/cli --save-dev
npm install @napacitor/device @napacitor/battery        # 按需装插件
npx nap init com.example.app "My App" --web-dir dist

# ② 构建前端产物后,生成宿主并同步
npm run build            # 产物输出到 dist/
npx nap add maui         # 生成 maui/ 宿主工程(自动 sync)
# 之后每次改动前端:
npx nap sync             # copy + 重新生成 napacitor.build.props

# ③ 运行
npx nap run --target windows      # 或 android / ios / maccatalyst
npx nap open maui                 # 用 IDE 打开宿主工程
```

前端代码(与 Capacitor 插件 API 同形):

```ts
import { Device } from '@napacitor/device';
import { Battery } from '@napacitor/battery';

const info = await Device.getInfo();          // { platform: 'windows', … }
await Battery.addListener('batteryStatusChange', (info) => { … });
```

## 宿主启动模型

1. MAUI Blazor 宿主由模板生成:BlazorWebView 加载 `wwwroot/index.html`,根组件 `Main.razor` 挂到 `#napacitor-root`;
2. `Main.razor` 的 `OnAfterRenderAsync(firstRender)` 调用 `NapacitorRuntime.StartAsync(JS)`;
3. 运行时:反射发现 `[NapacitorPlugin]` 插件 → eval 注入 `window.NapacitorNative` 平台信息桩 + 内嵌 napacitor-native-bridge.js(接管 `window.Napacitor`)→ 经 `__fetchText` 读 napacitor.config.json → 按 `napacitor.entries.json` 顺序 `import()` Web 入口脚本;
4. 插件调用:`window.DotNet.invokeMethodAsync('Napacitor', 'NAP_invoke', pluginId, method, argsJson)` → 信封 `{"ok":true,"data":…}`;事件经 `NapacitorNative.__emit(callbackId, dataJson)` 回推。

## 插件开发指南

以 `plugins/device` 为样板(Capacitor 插件同构三段式):

```text
plugins/device/
├── src/{index.ts, definitions.ts, web.ts}   # registerPlugin 封装 + 类型 + 浏览器实现
├── dist/                                     # tsc 产物(CJS,已提交)
├── maui/
│   ├── Napacitor.Device.csproj              # net10.0;引用运行时;Maui.Essentials 10.0.20
│   └── DevicePlugin.cs                      # [NapacitorPlugin("Device")] + [NapacitorMethod]
└── package.json                             # peerDeps @napacitor/core;files 含 dist/ + maui/
```

C# 侧要点:

- 类标 `[NapacitorPlugin("Device")]`、继承 `NapacitorPluginBase`、公共方法标 `[NapacitorMethod]` —— **零注册**:运行时按程序集名前缀 `Napacitor*` 反射扫描自动发现(对应 Capacitor Android 注解处理器);
- 方法参数:0 个、1 个强类型 DTO(camelCase 自动反序列化)或 1 个 `NapacitorCall`(松散访问);JS camelCase ↔ C# PascalCase 忽略大小写匹配;
- 事件:`NotifyListeners(eventName, data)` 推送;首个监听器到来时 `OnListenerAdded` 订阅原生源、最后一个离开时 `OnListenerRemoved` 退订(参见 `plugins/battery`);
- 不可用功能抛 `NotImplemented(...)` → JS 侧收到 `NOT_IMPLEMENTED` 的 `NapacitorException`。

## 内置插件

| 包 | API | MAUI Essentials 映射 |
|---|---|---|
| `@napacitor/device` | getInfo / getLanguageCode / getLocale | DeviceInfo、CultureInfo |
| `@napacitor/clipboard` | write({string}) / read() | Clipboard.SetTextAsync/GetTextAsync(image → NOT_IMPLEMENTED) |
| `@napacitor/haptics` | impact / notification / vibrate / selection | Vibration(时长映射 10/25/40ms;Windows 无操作) |
| `@napacitor/share` | share / canShare | Share.RequestAsync(ShareTextRequest) |
| `@napacitor/battery` | getBatteryInfo / addListener('batteryStatusChange') | Battery.ChargeLevel/PowerSource/BatteryInfoChanged(事件管线示范) |

## 开发本仓库

```bash
npm run build --workspaces    # 各包 tsc(再生成已提交的 dist/)
npm run sync                  # core/dist/native-bridge.js → maui/src/JSBridge/
                              # maui-template/ → cli/assets/maui-template/
```

- TS 一律严格模式,CJS + d.ts 输出(兼容 Vue CLI 4 / webpack 4);`dist/` 产物直接提交;
- CLI **零 npm 运行时依赖**(偏离 Capacitor 之处,见 `cli/README.md`);
- C# 目标 .NET 10 / MAUI 10.0.20 / Microsoft.JSInterop 10.0.0 / Microsoft.Maui.Essentials 10.0.20。

