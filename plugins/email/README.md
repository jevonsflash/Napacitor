# @napacitor/email

电子邮件插件,封装 .NET MAUI [`Email`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/email) API:编写并发送邮件。

## 安装方式

To use npm:

```bash
npm install @napacitor/email
```

To use yarn:

```bash
yarn add @napacitor/email
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Email } from '@napacitor/email';

// 检查是否支持
const { supported } = await Email.isSupported();

if (supported) {
  await Email.compose({
    to: ['user@example.com'],
    cc: ['admin@example.com'],
    subject: 'Hello',
    body: 'This is a test email.',
    isHtml: false,
  });
}
```

## 实现原理

封装 .NET MAUI 的 [`Email.Default.IsComposeSupported / ComposeAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/email) 门面,打开系统邮件客户端。设备不支持时 `compose()` 抛 `UNSUPPORTED`。注意:插件仅唤起系统邮件客户端,不提供后台静默发送;`attachments` 参数当前原生端未映射(MAUI `EmailMessage` 支持附件,本插件暂未接入)。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### isSupported()

检查是否支持发送邮件。

**Returns:** `Promise<EmailSupportedResult>`

### compose(options?)

编写并发送邮件(打开系统邮件客户端);设备不支持时抛 `UNSUPPORTED`。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `ComposeOptions` |

**Returns:** `Promise<void>`

## Interfaces

### ComposeOptions

| Prop              | Type       | Description                                                                    |
| ----------------- | ---------- | ------------------------------------------------------------------------------ |
| **`to`**          | `string[]` | 收件人列表。                                                                   |
| **`cc`**          | `string[]` | 抄送列表。                                                                     |
| **`bcc`**         | `string[]` | 密送列表。                                                                     |
| **`subject`**     | `string`   | 邮件主题。                                                                     |
| **`body`**        | `string`   | 邮件正文。                                                                     |
| **`isHtml`**      | `boolean`  | 是否为 HTML 格式。                                                             |
| **`attachments`** | `string[]` | 附件列表(文件路径)。当前原生端未映射(MAUI `EmailMessage` 支持附件,本插件暂未接入)。 |

### EmailSupportedResult

| Prop            | Type      | Description              |
| --------------- | --------- | ------------------------ |
| **`supported`** | `boolean` | 当前设备是否支持发送邮件。 |
