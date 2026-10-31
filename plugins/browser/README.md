# @napacitor/browser

内嵌浏览器插件(与 [@capacitor/browser](https://github.com/ionic-team/capacitor-plugins/tree/main/browser) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/browser
```

To use yarn:

```bash
yarn add @napacitor/browser
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Browser } from '@napacitor/browser';

await Browser.open({ url: 'https://example.com', toolbarColor: '#3282F6' });

// 关闭内嵌浏览器(MAUI Browser API 未提供跨平台关闭入口,原生端抛 NOT_IMPLEMENTED)
await Browser.close();

// 事件监听(Android/iOS;需平台代码,当前原生端不派发)
Browser.addListener('browserFinished', () => console.log('浏览器已关闭'));
Browser.addListener('browserPageLoaded', () => console.log('页面加载完成'));

// 移除全部监听
await Browser.removeAllListeners();
```

## 实现原理

封装 .NET MAUI 的 [`Browser`](https://learn.microsoft.com/dotnet/maui/platform-integration/appmodel/browser) 文档所述 API:`Browser.Default.OpenAsync(uri, BrowserLaunchOptions)`(SystemPreferred 模式:Android Custom Tabs / iOS SFSafariViewController / 桌面回退到外部浏览器)。`toolbarColor` 解析为 `PreferredToolbarColor`(非法颜色串按平台默认处理)。MAUI Browser API 仅提供 `OpenAsync`,`close` 与 `browserFinished / browserPageLoaded` 事件需平台代码,当前原生端不实现(见 API 说明)。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### open(options)

打开内嵌浏览器页面(SystemPreferred 模式)。

| Param       | Type          |
| ----------- | ------------- |
| **`options`** | `OpenOptions` |

**Returns:** `Promise<void>`

### close()

关闭浏览器窗口。MAUI Browser API 未提供跨平台关闭入口,原生端抛出 `NOT_IMPLEMENTED`(关闭 Android Custom Tabs / iOS SFSafariViewController 会话需少量平台代码);web 端尽力 `window.close()`(仅能关闭脚本打开的窗口)。

**Returns:** `Promise<void>`

### addListener('browserFinished', listenerFunc)

浏览器被用户关闭时派发。需监听 Custom Tabs 回调 / SFSafariViewController 委托,当前原生端不派发(注册监听器时输出调试提示)。

| Param              | Type                |
| ------------------ | ------------------- |
| **`eventName`**    | `'browserFinished'` |
| **`listenerFunc`** | `() => void`        |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('browserPageLoaded', listenerFunc)

首个页面加载完成时派发。同上,当前原生端不派发(需平台代码)。

| Param              | Type                  |
| ------------------ | --------------------- |
| **`eventName`**    | `'browserPageLoaded'` |
| **`listenerFunc`** | `() => void`          |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### OpenOptions

| Prop                   | Type                                 | Description                                                                                            |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **`url`**              | `string`                             | 要打开的绝对地址(必须为合法绝对地址,否则抛 `INVALID_ARGUMENTS`)。                                     |
| **`windowName`**       | `string`                             | web 专用:`window.open` 的 target(默认 `_blank`);其他平台忽略。                                         |
| **`toolbarColor`**     | `string`                             | 工具栏颜色(`#RRGGBB` / `#AARRGGBB`);平台不支持时忽略,非法颜色串按平台默认工具栏色处理。               |
| **`presentationStyle`** | `'fullscreen' \| 'popover'`         | iOS 专用:呈现风格;其他平台忽略。                                                                        |
| **`width`**            | `number`                             | iOS 专用(iPad popover 宽度);其他平台忽略。                                                              |
| **`height`**           | `number`                             | iOS 专用(iPad popover 高度);其他平台忽略。                                                              |
