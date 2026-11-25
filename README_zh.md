# Napacitor

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](https://github.com/jevonsflash/Napacitor/blob/master/LICENSE)
![codeSize](https://img.shields.io/github/languages/code-size/jevonsflash/Napacitor.svg?style=for-the-badge)
[![](https://img.shields.io/npm/v/@napacitor/core?style=for-the-badge)](https://www.npmjs.com/package/@napacitor/core)
[![](https://img.shields.io/static/v1?label=docs&message=napacitor&color=blue&style=for-the-badge)](https://napacitor.matoapp.net/docs)
<a href="[您的AtomGit项目链接](https://gitcode.com/jevonsflash1/Napacitor)"><img alt="AtomGit G-Star" style="height:28px" src="https://gitcode.com/jevonsflash1/Napacitor/star/new_badge.svg"/></a>


[English](README.md) | 中文

Napacitor 是一个跨平台原生运行时，让你能够使用现代 Web 工具链，轻松为 Android、iOS、Windows 和 macOS 构建高性能的原生应用。 Napacitor 深受[Capacitor](https://github.com/ionic-team/capacitor)启发，与其不同的是原生抽象层是 .NET MAUI Blazor，而非各平台的原生工程，因此项目将由单一干净的 C# 运行时驱动所有平台。

Napacitor 主要功能是：

- **混合开发**：用你熟悉的 Web 技术（原生 JavaScript、HTML、CSS，或 React、Angular、Vue）构建应用，并将其运行于 iOS、Android、Windows或macOS，并轻松部署到 App Store、Google Play 或 Microsoft Store。

- **原生访问**：提供了跨平台的 API 和代码执行层，使得从网页代码调用原生 SDK 变得轻松，并编写应用可能需要的自定义原生插件。

- **.NET 赋能**：界面层继续使用 npm、TypeScript 与你熟悉的框架；原生层引入 C# 生态和工程实践。





## 快速开始

### 1. 将 Napacitor 插入任何现有的 Web 应用中

```bash
npm i @napacitor/core
npm i -D @napacitor/maui @napacitor/cli
```

### 2. 初始化，同步，创建原生运行环境

指定应用 ID、名称和 Web 产物目录。Napacitor 会生成一份 MAUI 工程，并自动打包插件。

```bash
npx nap init com.example.app "My App" --web-dir dist
npx nap add maui
```

### 3. 运行到任何平台

选择目标平台，可选 `android` / `ios` / `maccatalyst` / `windows`。

```bash
npx nap run --target android
```

---


## 插件系统

每个官方插件都把 .NET MAUI 原生 API 包装为一致、基于 Promise 的 JavaScript 接口。你也可以按需创建自定义插件。

| 插件 | npm 包 | 说明 | 源码 / 文档 |
| --- | --- | --- | --- |
| Action Sheet | `@napacitor/action-sheet` | 从屏幕底部弹出的原生操作表（`Page.DisplayActionSheet`）。 | [plugins/action-sheet](https://github.com/jevonsflash/Napacitor/tree/main/plugins/action-sheet) |
| App | `@napacitor/app` | 高层应用状态与事件：生命周期、深链接、语言、退出。 | [plugins/app](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app) |
| App Actions | `@napacitor/app-actions` | 应用图标上的快捷操作（Android App Shortcuts、iOS Quick Actions、Windows 跳转列表）。 | [plugins/app-actions](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-actions) |
| App Info | `@napacitor/app-info` | 应用常规信息（`AppInfo`、`VersionTracking`）。 | [plugins/app-info](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-info) |
| App Launcher | `@napacitor/app-launcher` | 打开其他应用、URL 和地图（`Launcher`、`Map`）。 | [plugins/app-launcher](https://github.com/jevonsflash/Napacitor/tree/main/plugins/app-launcher) |
| Battery | `@napacitor/battery` | 电池电量与充电状态。 | [plugins/battery](https://github.com/jevonsflash/Napacitor/tree/main/plugins/battery) |
| Browser | `@napacitor/browser` | 应用内浏览器会话（Android Custom Tabs、iOS SFSafariViewController）。 | [plugins/browser](https://github.com/jevonsflash/Napacitor/tree/main/plugins/browser) |
| Camera | `@napacitor/camera` | 拍照、录像与媒体库选取（`MediaPicker`）。 | [plugins/camera](https://github.com/jevonsflash/Napacitor/tree/main/plugins/camera) |
| Clipboard | `@napacitor/clipboard` | 复制到系统剪贴板或从中粘贴。 | [plugins/clipboard](https://github.com/jevonsflash/Napacitor/tree/main/plugins/clipboard) |
| Connectivity | `@napacitor/connectivity` | 网络状态与连接变化事件。 | [plugins/connectivity](https://github.com/jevonsflash/Napacitor/tree/main/plugins/connectivity) |
| Contacts | `@napacitor/contacts` | 读取全部联系人与系统联系人选择器（`Contacts`）。 | [plugins/contacts](https://github.com/jevonsflash/Napacitor/tree/main/plugins/contacts) |
| Database SQLite | `@napacitor/database-sqlite` | 本地 SQLite 数据库：建表、增删改查、事务（`Microsoft.Data.Sqlite`）。 | [plugins/database-sqlite](https://github.com/jevonsflash/Napacitor/tree/main/plugins/database-sqlite) |
| Device | `@napacitor/device` | 设备型号、平台、系统版本、语言与区域。 | [plugins/device](https://github.com/jevonsflash/Napacitor/tree/main/plugins/device) |
| Dialog | `@napacitor/dialog` | 警告、确认与输入的原生对话框。 | [plugins/dialog](https://github.com/jevonsflash/Napacitor/tree/main/plugins/dialog) |
| Display | `@napacitor/display` | 屏幕指标、显示变化事件、屏幕常亮与方向锁定。 | [plugins/display](https://github.com/jevonsflash/Napacitor/tree/main/plugins/display) |
| Email | `@napacitor/email` | 打开系统邮件撰写界面。 | [plugins/email](https://github.com/jevonsflash/Napacitor/tree/main/plugins/email) |
| File Viewer | `@napacitor/file-viewer` | 用系统查看器打开文件。 | [plugins/file-viewer](https://github.com/jevonsflash/Napacitor/tree/main/plugins/file-viewer) |
| Filesystem | `@napacitor/filesystem` | 应用目录、捆绑文件与系统文件选择器（`FileSystem`、`FilePicker`）。 | [plugins/filesystem](https://github.com/jevonsflash/Napacitor/tree/main/plugins/filesystem) |
| Flashlight | `@napacitor/flashlight` | 控制设备手电筒（闪光灯）。 | [plugins/flashlight](https://github.com/jevonsflash/Napacitor/tree/main/plugins/flashlight) |
| Geolocation | `@napacitor/geolocation` | 获取并跟踪设备 GPS 位置。 | [plugins/geolocation](https://github.com/jevonsflash/Napacitor/tree/main/plugins/geolocation) |
| Haptics | `@napacitor/haptics` | 触觉与振动反馈。 | [plugins/haptics](https://github.com/jevonsflash/Napacitor/tree/main/plugins/haptics) |
| Local Notifications | `@napacitor/local-notification` | 立即或定时发送系统通知，支持权限请求、取消与点击回调。 | [plugins/local-notification](https://github.com/jevonsflash/Napacitor/tree/main/plugins/local-notification) |
| Motion | `@napacitor/motion` | 加速度计、陀螺仪、磁力计、指南针与气压计传感器。 | [plugins/motion](https://github.com/jevonsflash/Napacitor/tree/main/plugins/motion) |
| Phone Dialer | `@napacitor/phone-dialer` | 打开系统拨号界面拨打电话。 | [plugins/phone-dialer](https://github.com/jevonsflash/Napacitor/tree/main/plugins/phone-dialer) |
| Preferences | `@napacitor/preferences` | 轻量数据的键值持久化存储。 | [plugins/preferences](https://github.com/jevonsflash/Napacitor/tree/main/plugins/preferences) |
| Security | `@napacitor/security` | 用操作系统级安全设施存储机密值（iOS Keychain / Android Keystore / Windows DPAPI）。 | [plugins/security](https://github.com/jevonsflash/Napacitor/tree/main/plugins/security) |
| Share | `@napacitor/share` | 通过系统分享面板分享内容。 | [plugins/share](https://github.com/jevonsflash/Napacitor/tree/main/plugins/share) |
| SMS | `@napacitor/sms` | 打开系统短信撰写界面。 | [plugins/sms](https://github.com/jevonsflash/Napacitor/tree/main/plugins/sms) |


自定义插件请查看官方文档的[「构建 Napacitor 插件」](https://napacitor.matoapp.net/docs/plugins/tutorial/introduction)章节


## 原理

### 架构设计

![alt text](/assets/arch.png)





与 Capacitor 为每个平台维护独立原生工程不同，Napacitor 的原生层是 **.NET MAUI Blazor**（BlazorWebView + JSInterop）。同一份 C# 运行时覆盖 Android、iOS、Mac Catalyst 和 Windows。

```text
Web 应用（dist/ + napacitor.config.json + node_modules/@napacitor/*）
        │  nap add maui / nap sync
        ▼
MAUI Blazor 宿主（maui/：App.csproj、BlazorWebView、wwwroot/、napacitor.build.props）
        │
        ▼
Napacitor 运行时 + 插件（C#，反射自动发现）
        │  JS ⇄ DotNet.invokeMethodAsync('Napacitor', …)
        ▼
.NET MAUI 10（net10.0-android / -ios / -maccatalyst / -windows）
```
### 宿主启动流程

1. 模板生成的 BlazorWebView 加载 `wwwroot/index.html`，根组件 `Main.razor` 挂载到 `#napacitor-root`；
2. `Main.razor` 首次渲染后调用 `NapacitorRuntime.StartAsync(JS)`；
3. 运行时反射发现 `[NapacitorPlugin]` 插件，注入原生桥 `window.Napacitor`，读取配置，并按 `napacitor.entries.json` 的顺序加载 Web 入口脚本；
4. 插件调用经 `window.DotNet.invokeMethodAsync('Napacitor', 'NAP_invoke', …)` 发出，返回 `{"ok":true,"data":…}` 信封；原生事件经 `NapacitorNative.__emit` 推回 WebView。


## 支持平台

| 平台 | TargetFramework | 最低系统版本 |
|---|---|---|
| Android | `net10.0-android` | Android 7.0（API 24） |
| iOS | `net10.0-ios` | iOS 17.0 |
| Mac Catalyst | `net10.0-maccatalyst` | macOS 13.5 |
| Windows | `net10.0-windows10.0.19041.0` | Windows 10 1809（build 17763） |

## 环境要求

- **Node.js 18+**（用于 `nap` CLI）
- **.NET 10 SDK**，并安装 MAUI workload：`dotnet workload install maui`
- **Windows**：Windows 10 1809+ 或 Windows 11
- **Android**：Android SDK（可通过 `ANDROID_HOME` 指定）；运行需要模拟器或开启 USB 调试的真机
- **iOS / Mac Catalyst**：需要 macOS + Xcode，并安装 `dotnet workload install ios maccatalyst`

更多细节见文档的[「环境配置」](https://napacitor.matoapp.net/docs/getting-started/environment-setup)章节


## 文档

[官方文档](https://napacitor.matoapp.net/docs) 





