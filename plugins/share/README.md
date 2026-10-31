# @napacitor/share

系统分享插件(与 [@capacitor/share](https://github.com/ionic-team/capacitor-plugins/tree/main/share) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/share
```

To use yarn:

```bash
yarn add @napacitor/share
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Share } from '@napacitor/share';

await Share.share({
  title: 'Napacitor',
  text: '看看这个项目',
  url: 'https://example.com',
  dialogTitle: '分享到',
});

const { canShare } = await Share.canShare();
```

## 实现原理

封装 .NET MAUI 的 [`Share`](https://learn.microsoft.com/dotnet/maui/platform-integration/data/share) 文档所述 API:`Share.Default.RequestAsync(ShareTextRequest)`,其中 `title → Subject`、`dialogTitle → Title`、`text/url → Text/Uri`。MAUI 各目标平台均支持分享,`canShare()` 恒返回 `true`。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### share(options)

弹出系统分享面板(`text` 与 `url` 均未提供时抛 `INVALID_ARGUMENTS`)。

| Param       | Type           |
| ----------- | -------------- |
| **`options`** | `ShareOptions` |

**Returns:** `Promise<void>`

### canShare()

当前平台是否支持分享。

**Returns:** `Promise<CanShareResult>`

## Interfaces

### ShareOptions

| Prop              | Type     | Description                                                                 |
| ----------------- | -------- | --------------------------------------------------------------------------- |
| **`title`**       | `string` | 分享主题(部分平台作为邮件主题等使用;映射 `ShareTextRequest.Subject`)。      |
| **`text`**        | `string` | 分享文本。                                                                  |
| **`url`**         | `string` | 分享链接(与 `text` 可同时提供)。                                            |
| **`dialogTitle`** | `string` | 分享面板标题(Android 选择器等;映射 `ShareRequestBase.Title`)。              |

### CanShareResult

| Prop           | Type      | Description                                                        |
| -------------- | --------- | ------------------------------------------------------------------ |
| **`canShare`** | `boolean` | 当前平台是否支持分享(MAUI 各目标平台均支持,恒为 `true`)。           |
