# @napacitor/app-actions

应用快捷方式插件(与 [MAUI AppActions](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/app-actions) 对应)。

在应用图标上提供快捷入口(Android App Shortcuts / iOS 主屏 Quick Actions /
Windows 任务栏跳转列表——Windows 仅 MSIX 打包应用支持)。

## 用法

```ts
import { AppActions } from '@napacitor/app-actions';

// 检查平台支持后设置快捷方式(整体替换)
const { supported } = await AppActions.isSupported();
if (supported) {
  await AppActions.set({
    actions: [
      { id: 'inbox', title: '收件箱', subtitle: '查看新邮件' },
      { id: 'compose', title: '写邮件' },
    ],
  });
}

// 读取当前快捷方式
const { actions } = await AppActions.get();

// 响应快捷方式点击
await AppActions.addListener('appActionPerformed', ({ action }) => {
  console.log('触发了快捷方式:', action.id);
});
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.AppActions`,运行时反射自动发现)

原生实现映射:`AppActions.Default.SetAsync / GetAsync / IsSupported`。

## 宿主接入(appActionPerformed 事件)

MAUI 的快捷方式点击回调注册在宿主启动时(插件无法自行订阅),宿主需在
`MauiProgram.cs` 转发到插件。

`nap init` / `nap add maui` 生成的宿主已内置该转发(模板按类型名反射调用
`AppActionsPlugin.NotifyActionPerformed`,未装本插件时静默跳过),以下是自定义
宿主时需自行添加的等价代码:

```csharp
using Napacitor.Plugins.AppActions;

builder.ConfigureEssentials(essentials =>
{
    essentials.OnAppAction(action => AppActionsPlugin.NotifyActionPerformed(action));
});
```

### Android

`Platforms/Android/MainActivity.cs` 需添加 `IntentFilter` 与两处转发。缺少该
`IntentFilter` 时启动器解析不到快捷方式的 Intent,点击快捷方式会由系统提示
"应用未安装"。Napacitor 模板已内置这部分,自定义宿主需补:

```csharp
[Activity( /* ...模板原有参数... */ )]
[IntentFilter(new[] { Platform.Intent.ActionAppAction },
              Categories = new[] { global::Android.Content.Intent.CategoryDefault })]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnResume()
    {
        base.OnResume();
        Platform.OnResume(this);
    }

    protected override void OnNewIntent(Android.Content.Intent intent)
    {
        base.OnNewIntent(intent);
        Platform.OnNewIntent(intent);
    }
}
```

### iOS / Mac Catalyst

使用 .NET MAUI 应用模板时无需额外设置。

### Windows

仅 MSIX 打包应用支持跳转列表(`WindowsPackageType` 为 `None` 的未打包
应用 `isSupported()` 返回 `false`)。

## 与 Capacitor 的差异

- Capacitor 无官方 app-actions 插件,本插件 API 按 MAUI AppActions 形状设计
  (camelCase 化:set / get / isSupported / appActionPerformed 事件);
- `icon` 须与各平台资源目录中的图标匹配(与 MAUI `AppAction` 构造函数一致);
  平台不支持时忽略;
- 平台不支持 `set()` 时,MAUI 抛出的 `FeatureNotSupportedException`
  将以错误信封形式返回给 JS。
