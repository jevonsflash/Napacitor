# @napacitor/app

应用生命周期插件(与 [@capacitor/app](https://github.com/ionic-team/capacitor-plugins/tree/main/app) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/app
```

To use yarn:

```bash
yarn add @napacitor/app
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { App } from '@napacitor/app';

const { isActive } = await App.getState();
const { value: language } = await App.getAppLanguage(); // 'zh-CN'
const { url } = await App.getLaunchUrl();

App.addListener('appStateChange', ({ isActive }) => console.log('active:', isActive));
App.addListener('pause', () => console.log('进入后台'));
App.addListener('resume', () => console.log('回到前台'));
App.addListener('appUrlOpen', ({ url }) => console.log('深度链接:', url));
App.addListener('backButton', ({ canGoBack }) => console.log('返回键'));

// 退出应用(仅 Windows/macOS 有原生语义;Android/iOS 系统不鼓励程序化退出)
// await App.exitApp();

// 移除全部监听
await App.removeAllListeners();
```

## 实现原理

封装 .NET MAUI 的 [Window 生命周期](https://learn.microsoft.com/dotnet/maui/fundamentals/windows) 文档所述 API:首个生命周期监听器注册(或首次 `getState`)后惰性挂接主 Window 的 `Resumed / Stopped / Backgrounding` 事件,状态变化经 `appStateChange / pause / resume` 派发。`exitApp` 映射 `Application.Quit`(仅 Windows/macOS 有原生语义);`getAppLanguage` 读取 `CultureInfo.CurrentUICulture`。

深度链接(`appUrlOpen` / `getLaunchUrl`)与 Android 返回键(`backButton`)MAUI 无跨平台可订阅事件,需宿主在平台代码中转发到插件静态入口:

```csharp
// App.xaml.cs(全平台深度链接)
protected override void OnAppLinkRequestReceived(Uri uri)
{
    base.OnAppLinkRequestReceived(uri);
    Napacitor.Plugins.App.AppPlugin.NotifyAppLink(uri);
}

// Platforms/Android/MainActivity.cs(仅 Android 返回键)
public override void OnBackPressed()
{
    if (!Napacitor.Plugins.App.AppPlugin.NotifyBackButton())
    {
        base.OnBackPressed(); // 无 JS 监听器时走默认行为
    }
}
```

`NotifyBackButton` 返回 `true` 表示 JS 已监听(宿主应拦截本次返回键);`NotifyAppLink` 在插件实例尚未创建时仅记录链接,`getLaunchUrl` 仍可读到。

## 权限

### Android

- **深度链接**:`AndroidManifest.xml` 的 MainActivity 需声明 `intent-filter`(自定义 scheme),并在 `MainActivity` 重写 `OnBackPressed` 转发返回键(见上方实现原理)。
- **返回键**:如需监听 `backButton`,转发后由 JS 决定是否退出(如调用 `App.exitApp()`;注意 Android 系统不鼓励程序化退出,`Application.Quit` 在 Android 上无原生语义)。

### iOS

`Info.plist` 需声明 `CFBundleURLTypes` 注册自定义 URL scheme,并在 `App.xaml.cs` 转发(见上方实现原理)。iOS 不鼓励程序化退出,`exitApp` 在 iOS 上无原生语义。

### Windows

打包应用在 `Package.appxmanifest` 声明协议;`Application.Quit` 在 Windows 上有效。

## API

### exitApp()

退出应用。仅 Windows/macOS 有原生语义,Android/iOS 系统不鼓励程序化退出(HIG/Play 政策),如需强退需宿主平台代码。

**Returns:** `Promise<void>`

### getState()

获取应用当前状态(顺带惰性挂接生命周期钩子)。

**Returns:** `Promise<AppState>`

### getLaunchUrl()

获取触发应用启动的深度链接。需宿主注册 URL scheme 并在 `App.xaml.cs` 转发,未收到过时 `url` 为空字符串。

**Returns:** `Promise<AppUrl>`

### getAppLanguage()

获取应用语言(`CultureInfo.CurrentUICulture`,BCP-47 风格如 'zh-CN';无法识别时退回 ISO 双字母)。

**Returns:** `Promise<AppLanguage>`

### addListener('appStateChange', listenerFunc)

应用前后台切换时派发(payload 为 `AppState`)。

| Param              | Type                              |
| ------------------ | --------------------------------- |
| **`eventName`**    | `'appStateChange'`                |
| **`listenerFunc`** | `(state: AppState) => void`       |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('pause', listenerFunc)

应用进入后台时派发。

| Param              | Type                |
| ------------------ | ------------------- |
| **`eventName`**    | `'pause'`           |
| **`listenerFunc`** | `() => void`        |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('resume', listenerFunc)

应用回到前台时派发。

| Param              | Type                |
| ------------------ | ------------------- |
| **`eventName`**    | `'resume'`          |
| **`listenerFunc`** | `() => void`        |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('appUrlOpen', listenerFunc)

应用经深度链接打开/唤起时派发。需宿主在 `App.xaml.cs` 的 `OnAppLinkRequestReceived` 中调用 `AppPlugin.NotifyAppLink(uri)` 转发,否则不会触发。

| Param              | Type                            |
| ------------------ | ------------------------------- |
| **`eventName`**    | `'appUrlOpen'`                  |
| **`listenerFunc`** | `(data: AppUrl) => void`        |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('backButton', listenerFunc)

Android 硬件返回键按下时派发。需宿主在 `MainActivity.OnBackPressed` 中调用 `AppPlugin.NotifyBackButton()` 转发,否则不会触发。监听此事件即拦截本次返回键,如需退出应用请调用 `App.exitApp()`。

| Param              | Type                                 |
| ------------------ | ------------------------------------ |
| **`eventName`**    | `'backButton'`                       |
| **`listenerFunc`** | `(data: BackButtonResponse) => void` |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### AppState

| Prop           | Type      | Description                     |
| -------------- | --------- | ------------------------------- |
| **`isActive`** | `boolean` | 应用是否处于活跃状态(前台且可交互)。 |

### AppLanguage

| Prop        | Type     | Description                                                              |
| ----------- | -------- | ------------------------------------------------------------------------ |
| **`value`** | `string` | 应用语言(BCP-47 风格,如 'zh-CN';无法识别时退回 ISO 双字母)。            |

### AppUrl

| Prop      | Type     | Description                            |
| --------- | -------- | -------------------------------------- |
| **`url`** | `string` | 深度链接地址;未收到过时为空字符串。   |

### BackButtonResponse

| Prop            | Type      | Description                                   |
| --------------- | --------- | --------------------------------------------- |
| **`canGoBack`** | `boolean` | WebView 历史是否可回退(宿主未提供时为 `false`)。 |
