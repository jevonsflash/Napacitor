# @napacitor/maui

Napacitor 的 **.NET MAUI 原生运行时**,对应 Capacitor 仓库中 `android/`(`@capacitor/android`)的角色 —— 区别在于原生抽象层是 **.NET MAUI Blazor(BlazorWebView + JSInterop)**,同一份 C# 代码覆盖 Android / iOS / Mac Catalyst / Windows 全部平台。

## 结构

```
maui/
├── src/
│   ├── Napacitor.csproj          # net10.0 类库;程序集名固定为 Napacitor
│   ├── NapacitorRuntime.cs       # 运行时:插件发现、原生桥注入、入口导入、事件发送
│   ├── NapacitorBridge.cs        # 静态 [JSInvokable] 入口(JS → C#)
│   ├── PluginRegistry.cs         # 反射自动发现 [NapacitorPlugin](零手动注册)
│   ├── ListenerRegistry.cs       # callbackId → (插件, 事件) 注册表
│   ├── NapacitorException.cs     # 带错误码的异常
│   ├── NapacitorJson.cs          # camelCase / 大小写不敏感的共享 JsonSerializerOptions
│   ├── Plugins/                  # 插件基础设施(特性、接口、基类、NapacitorCall)
│   └── JSBridge/                 # 内嵌原生桥脚本(由 core/dist 同步)
└── package.json                  # npm 包形态,files 仅含 src/
```

## 宿主如何接入

MAUI Blazor 宿主(由 `nap add maui` 生成的模板)只需两处:

1. csproj 引用本运行时(`nap sync` 生成的 `napacitor.build.props` 完成);
2. Blazor 根组件 `Main.razor`:

```razor
@inject IJSRuntime JS

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await NapacitorRuntime.StartAsync(JS);
        }
    }
}
```

启动顺序:发现插件 → 注入 `window.NapacitorNative` 与原生桥(eval)→ 读取 `napacitor.config.json` → 按 `napacitor.entries.json` 顺序 `import()` Web 应用入口脚本。

## 桥协议

| 方向 | 通道 |
|---|---|
| JS → C# | `window.DotNet.invokeMethodAsync('Napacitor', 'NAP_invoke', pluginId, method, argsJson)` |
| C# → JS | `js.InvokeVoidAsync('NapacitorNative.__emit', callbackId, dataJson)` |
| C# → JS(事件) | `js.InvokeVoidAsync('eval', …)` 派发 `CustomEvent`(见下 `TriggerJSEventAsync`) |

调用结果为信封:`{"ok":true,"data":…}` / `{"ok":false,"error":{"code":"…","message":"…"}}`。

## Core APIs(MAUI ⇄ Web 交互)

与 Capacitor 的 Core APIs(reference/core-apis)对应 —— 插件调用之外的桥层基础交互能力:

| Capacitor | Napacitor(C#) | 说明 |
|---|---|---|
| `bridge.getConfig()` | `NapacitorRuntime.AppConfig` / 插件基类 `AppConfig` | napacitor.config.json 根配置(`JsonElement`;未加载时 `ValueKind` 为 `Undefined`) |
| `bridge.triggerJSEvent(name, target, data?)` | `TriggerJSEventAsync(name, target = "window", dataJson?)` | 在 window / document 上派发 `CustomEvent`;另有 `(name, object? data)` 便捷重载 |
| iOS `localURL(fromWebURL:)` | `ReadAssetTextAsync(url)` | C# 侧按 Web 的 URL 规则读取 wwwroot 静态文本(经 WebView 同源通道,Android 的 apk 内资产同样可读) |
| iOS `viewController` / `DispatchQueue.main` | 插件工程直接用 MAUI Essentials | `Application.Current.MainPage`、`MainThread.InvokeOnMainThreadAsync(…)` —— 运行时库刻意零 MAUI 框架依赖(仅引 Microsoft.JSInterop),UI 能力留在插件/宿主层 |
| `saveCall` / `keepAlive` | 无需(架构差异) | Task 异步模型天然承载单次异步完成;多次回调即事件管线(`NotifyListeners` + JS `addListener`) |

`TriggerJSEventAsync` 用例 —— 原生主动通知前端(插件事件管线之外的广播通道):

```csharp
// 插件内(基类方法;宿主代码可用 NapacitorRuntime.Current?.TriggerJSEventAsync(…))
await TriggerJSEventAsync("napacitor:download", "window",
    """{"progress":100,"file":"report.pdf"}""");

// 便捷重载:对象直接序列化为事件 detail
await TriggerJSEventAsync("napacitor:download", new { Progress = 100, File = "report.pdf" });
```

```ts
// Web 侧:普通 DOM 事件接收
window.addEventListener('napacitor:download', (e) => {
  console.log('下载完成', (e as CustomEvent).detail);
});
```

数据须为序列化 JSON 字符串(与 Capacitor 同约定),JS 侧自动 `JSON.parse` 为事件 `detail`,解析失败时以原始字符串传入;事件名与数据均经 JSON 字面量嵌入脚本,无注入风险。

Web 侧工具(`@napacitor/core` 的 `Napacitor` 对象,对应 Capacitor 的 Web API)已内置:`getPlatform()`、`isNativePlatform()`、`isPluginAvailable(name)`、`convertFileUri(uri)`。其中 `convertFileUri` 直接返回原 URI:MAUI Blazor 的 WebView 与静态资产同源,不需要 Capacitor 那种 `file://` → `http://localhost` 的协议改写;iOS 的 `portablePath(fromLocalURL:)` 同理 —— 相对路径在 WebView 直接可用,反向(C# 读 wwwroot)用 `ReadAssetTextAsync` 借道。

