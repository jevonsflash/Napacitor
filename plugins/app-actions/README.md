# @napacitor/app-actions

应用快捷方式插件(与 [MAUI AppActions](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/app-actions) 对应)。在应用图标上提供快捷入口(Android App Shortcuts / iOS 主屏 Quick Actions / Windows 任务栏跳转列表)。

## 安装方式

To use npm:

```bash
npm install @napacitor/app-actions
```

To use yarn:

```bash
yarn add @napacitor/app-actions
```

Sync native files:

```bash
npx nap sync
```

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

// 移除全部监听
await AppActions.removeAllListeners();
```

## 实现原理

封装 .NET MAUI 的 [`AppActions`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/app-actions) 文档所述 API:`AppActions.Default.SetAsync / GetAsync / IsSupported`。MAUI 的快捷方式点击回调注册在宿主启动时(插件无法自行订阅),宿主需在 `MauiProgram.cs` 转发到插件:

```csharp
using Napacitor.Plugins.AppActions;

builder.ConfigureEssentials(essentials =>
{
    essentials.OnAppAction(action => AppActionsPlugin.NotifyActionPerformed(action));
});
```

`nap init` / `nap add maui` 生成的宿主已内置该转发(模板按类型名反射调用 `AppActionsPlugin.NotifyActionPerformed`,未装本插件时静默跳过)。

## 权限

### Android

无需权限声明,但 `Platforms/Android/MainActivity.cs` 需添加 `IntentFilter` 与两处转发。缺少该 `IntentFilter` 时启动器解析不到快捷方式的 Intent,点击快捷方式会由系统提示"应用未安装"。Napacitor 模板已内置这部分,自定义宿主需补:

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

无需权限声明,但仅 MSIX 打包应用支持跳转列表(`WindowsPackageType` 为 `None` 的未打包应用 `isSupported()` 返回 `false`)。

## API

### set(options)

设置应用快捷方式(整体替换当前列表)。平台不支持时抛 `FeatureNotSupported` 错误(以错误信封形式返回给 JS)。

| Param       | Type         |
| ----------- | ------------ |
| **`options`** | `SetOptions` |

**Returns:** `Promise<void>`

### get()

获取当前已设置的应用快捷方式。

**Returns:** `Promise<GetActionsResult>`

### isSupported()

检查当前平台是否支持应用快捷方式。

**Returns:** `Promise<IsSupportedResult>`

### addListener('appActionPerformed', listenerFunc)

用户从应用图标触发快捷方式时派发。需宿主在 `ConfigureEssentials` 中转发(见实现原理),否则不会触发。

| Param              | Type                                    |
| ------------------ | --------------------------------------- |
| **`eventName`**    | `'appActionPerformed'`                  |
| **`listenerFunc`** | `(event: AppActionPerformed) => void`   |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### AppActionInfo

| Prop           | Type     | Description                                                                                      |
| -------------- | -------- | ------------------------------------------------------------------------------------------------ |
| **`id`**       | `string` | 唯一标识(用于响应点击时区分操作)。`set()` 时不能为空,否则抛出 `INVALID_ARGUMENTS`。              |
| **`title`**    | `string` | 显示标题。`set()` 时不能为空,否则抛出 `INVALID_ARGUMENTS`。                                       |
| **`subtitle`** | `string` | 副标题(平台支持时显示在标题下方)。                                                                |
| **`icon`**     | `string` | 图标(需与各平台资源目录中的图标匹配,与 MAUI `AppAction` 构造函数一致);平台不支持时忽略。`get()` 不回传(MAUI `AppAction` 未暴露 Icon 读取器)。 |

### SetOptions

| Prop          | Type              | Description                          |
| ------------- | ----------------- | ------------------------------------ |
| **`actions`** | `AppActionInfo[]` | 要设置的快捷方式列表(整体替换当前列表)。 |

### GetActionsResult

| Prop          | Type              | Description              |
| ------------- | ----------------- | ------------------------ |
| **`actions`** | `AppActionInfo[]` | 当前已设置的快捷方式列表。 |

### IsSupportedResult

| Prop            | Type      | Description                    |
| --------------- | --------- | ------------------------------ |
| **`supported`** | `boolean` | 当前平台是否支持应用快捷方式。 |

### AppActionPerformed

| Prop         | Type            | Description        |
| ------------ | --------------- | ------------------ |
| **`action`** | `AppActionInfo` | 被触发的快捷方式。 |
