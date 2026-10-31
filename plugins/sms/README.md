# @napacitor/sms

短信插件,封装 .NET MAUI [`Sms`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/sms) API:发送短信。

## 安装方式

To use npm:

```bash
npm install @napacitor/sms
```

To use yarn:

```bash
yarn add @napacitor/sms
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Sms } from '@napacitor/sms';

// 检查是否支持
const { supported } = await Sms.isSupported();

if (supported) {
  await Sms.send({
    recipients: ['+8613800138000'],
    body: 'Hello!',
  });
}
```

## 实现原理

封装 .NET MAUI 的 [`Sms.Default.IsComposeSupported / ComposeAsync`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/sms) 门面,打开系统短信客户端。设备不支持时 `send()` 抛 `UNSUPPORTED`。注意:插件仅唤起系统短信客户端,不提供后台静默发送。

## 权限

### Android

无需额外配置(短信经系统 Intent 完成,不直接发送)。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### isSupported()

检查是否支持发送短信。

**Returns:** `Promise<SmsSupportedResult>`

### send(options)

发送短信(打开系统短信客户端;设备不支持时抛 `UNSUPPORTED`)。

| Param       | Type         |
| ----------- | ------------ |
| **`options`** | `SmsOptions` |

**Returns:** `Promise<void>`

## Interfaces

### SmsOptions

| Prop             | Type       | Description                                              |
| ---------------- | ---------- | -------------------------------------------------------- |
| **`recipients`** | `string[]` | 收件人手机号列表(不能为空,否则抛 `INVALID_ARGUMENTS`)。  |
| **`body`**       | `string`   | 短信正文。                                               |

### SmsSupportedResult

| Prop            | Type      | Description              |
| --------------- | --------- | ------------------------ |
| **`supported`** | `boolean` | 当前设备是否支持发送短信。 |
