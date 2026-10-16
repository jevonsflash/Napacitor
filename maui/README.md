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

调用结果为信封:`{"ok":true,"data":…}` / `{"ok":false,"error":{"code":"…","message":"…"}}`。
