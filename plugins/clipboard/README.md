# @napacitor/clipboard

系统剪贴板插件(与 [@capacitor/clipboard](https://github.com/ionic-team/capacitor-plugins/tree/main/clipboard) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/clipboard
```

To use yarn:

```bash
yarn add @napacitor/clipboard
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Clipboard } from '@napacitor/clipboard';

await Clipboard.write({ string: '要复制的内容' });

const result = await Clipboard.read();
console.log(result.value); // 剪贴板文本
```

## 实现原理

封装 .NET MAUI 的 [`Clipboard`](https://learn.microsoft.com/dotnet/maui/platform-integration/data/clipboard) 文档所述 API:`Clipboard.Default.SetTextAsync / GetTextAsync`。MAUI Essentials 剪贴板仅支持文本,图像写入(`image` 参数)抛出 `NOT_IMPLEMENTED`。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### write(options)

写入剪贴板。`string` 与 `image` 均未提供时抛 `INVALID_ARGUMENTS`。

| Param       | Type           |
| ----------- | -------------- |
| **`options`** | `WriteOptions` |

**Returns:** `Promise<void>`

### read()

读取剪贴板文本(空剪贴板返回空字符串)。

**Returns:** `Promise<ReadResult>`

## Interfaces

### WriteOptions

| Prop         | Type     | Description                                                                            |
| ------------ | -------- | -------------------------------------------------------------------------------------- |
| **`string`** | `string` | 要复制的文本。                                                                         |
| **`image`**  | `string` | 要复制的图像(base64 data URI)。MAUI Essentials 剪贴板仅支持文本,原生端抛 `NOT_IMPLEMENTED`。 |

### ReadResult

| Prop        | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| **`value`** | `string` | 剪贴板中的文本(空剪贴板返回空字符串)。 |
