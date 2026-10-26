# @napacitor/app

应用生命周期插件(与 [@capacitor/app](https://github.com/ionic-team/capacitor-plugins/tree/main/app) 对应)。

## 用法

```ts
import { App } from '@napacitor/app';

const { isActive } = await App.getState();
const { value: language } = await App.getAppLanguage(); // 'zh-CN'

App.addListener('appStateChange', ({ isActive }) => console.log('active:', isActive));
App.addListener('pause', () => console.log('进入后台'));
App.addListener('resume', () => console.log('回到前台'));
App.addListener('appUrlOpen', ({ url }) => console.log('深度链接:', url));
App.addListener('backButton', ({ canGoBack }) => console.log('返回键'));

const { url } = await App.getLaunchUrl();
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.App`,运行时反射自动发现)

原生实现映射:Window 生命周期事件 `Resumed / Stopped / Backgrounding`
(appStateChange / pause / resume)、`Application.Quit`(exitApp)、
`CultureInfo.CurrentUICulture`(getAppLanguage)。首个生命周期监听器注册(或首次
`getState`)后惰性挂接主 Window。

## 与 Capacitor 的差异

- **exitApp**:映射 `Application.Quit`,仅 Windows/macOS 有原生语义;Android/iOS 系统
  不鼓励程序化退出(HIG/Play 政策),如需强退需宿主平台代码;
- **appUrlOpen / getLaunchUrl(深度链接)**:MAUI 无跨平台的 App Link 事件,宿主需
  ①注册 URL scheme,②在 `App.xaml.cs` 转发:

  ```csharp
  protected override void OnAppLinkRequestReceived(Uri uri)
  {
      base.OnAppLinkRequestReceived(uri);
      Napacitor.Plugins.App.AppPlugin.NotifyAppLink(uri);
  }
  ```

  URL scheme 注册:Android 在 `AndroidManifest.xml` 的 MainActivity 加
  `<intent-filter>`(`<data android:scheme="your-scheme" />`);iOS 在 `Info.plist` 加
  `CFBundleURLTypes`;Windows 打包应用在 `Package.appxmanifest` 声明协议;
- **backButton(Android)**:宿主在 `MainActivity` 重写返回键并转发:

  ```csharp
  public override void OnBackPressed()
  {
      if (!AppPlugin.NotifyBackButton())
      {
          base.OnBackPressed(); // 无 JS 监听器时走默认行为
      }
  }
  ```

  `NotifyBackButton` 返回 true 表示 JS 已监听(宿主应拦截本次返回键);
- **appRestoredResult / minimizeApp / edgeGesture**:暂未实现。
