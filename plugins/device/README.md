# @napacitor/device

设备基础信息插件(与 [@capacitor/device](https://github.com/ionic-team/capacitor-plugins/tree/main/device) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/device
```

To use yarn:

```bash
yarn add @napacitor/device
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Device } from '@napacitor/device';

const info = await Device.getInfo();
// { model, platform, osVersion, manufacturer, isVirtual, name? }

const lang = await Device.getLanguageCode(); // { value: 'zh' }
const locale = await Device.getLocale();     // { value: 'zh-CN' }
```

## 实现原理

封装 .NET MAUI 的 [`DeviceInfo`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/device-information) 文档所述 API:`DeviceInfo.Current`(Model / Manufacturer / Name / VersionString / DeviceType)与 `CultureInfo`(语言 / 区域)。`isVirtual` = `DeviceType == Virtual`;`platform` 取 Napacitor 运行时平台名(`android` / `ios` / `windows` / `mac`)。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### getInfo()

获取设备信息。

**Returns:** `Promise<DeviceInfo>`

### getLanguageCode()

获取当前 UI 语言代码(`CultureInfo.CurrentUICulture.TwoLetterISOLanguageName`)。

**Returns:** `Promise<GetLanguageCodeResult>`

### getLocale()

获取当前区域设置(`CultureInfo.CurrentCulture.Name`)。

**Returns:** `Promise<GetLocaleResult>`

## Interfaces

### DeviceInfo

| Prop               | Type      | Description                                      |
| ------------------ | --------- | ------------------------------------------------ |
| **`model`**        | `string`  | 设备型号(如 iPhone13,2)。                        |
| **`platform`**     | `string`  | 平台:`android` / `ios` / `mac` / `windows` / `web`。 |
| **`osVersion`**    | `string`  | 操作系统版本。                                   |
| **`manufacturer`** | `string`  | 制造商。                                         |
| **`isVirtual`**    | `boolean` | 是否为模拟器/虚拟设备(`DeviceType == Virtual`)。 |
| **`name`**         | `string`  | 设备名称(部分平台提供,可能为空)。               |

### GetLanguageCodeResult

| Prop        | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| **`value`** | `string` | 当前 UI 语言代码(如 zh、en)。 |

### GetLocaleResult

| Prop        | Type     | Description                |
| ----------- | -------- | -------------------------- |
| **`value`** | `string` | 当前区域设置(如 zh-CN)。   |
