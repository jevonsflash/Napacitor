# @napacitor/phone-dialer

电话拨号插件,封装 .NET MAUI [`PhoneDialer`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/phone-dialer) API:拨打电话。

## 安装方式

To use npm:

```bash
npm install @napacitor/phone-dialer
```

To use yarn:

```bash
yarn add @napacitor/phone-dialer
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { PhoneDialer } from '@napacitor/phone-dialer';

// 检查是否支持
const { supported } = await PhoneDialer.isSupported();

if (supported) {
  await PhoneDialer.open({ number: '+8613800138000' });
}
```

## 实现原理

封装 .NET MAUI 的 [`PhoneDialer.Default.IsSupported / Open`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/phone-dialer) 门面,打开系统拨号界面。设备不支持时 `open()` 抛 `UNSUPPORTED`。

## 权限

### Android

无需额外配置(拨号经系统 Intent 完成,不直接拨出)。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### isSupported()

检查是否支持拨打电话。

**Returns:** `Promise<PhoneDialerSupportedResult>`

### open(options)

拨打电话(打开系统拨号界面;设备不支持时抛 `UNSUPPORTED`)。

| Param       | Type          |
| ----------- | ------------- |
| **`options`** | `DialOptions` |

**Returns:** `Promise<void>`

## Interfaces

### DialOptions

| Prop         | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| **`number`** | `string` | 电话号码(不能为空,否则抛 `INVALID_ARGUMENTS`)。 |

### PhoneDialerSupportedResult

| Prop            | Type      | Description              |
| --------------- | --------- | ------------------------ |
| **`supported`** | `boolean` | 当前设备是否支持拨打电话。 |
