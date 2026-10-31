# @napacitor/dialog

原生对话框插件(与 [@capacitor/dialog](https://github.com/ionic-team/capacitor-plugins/tree/main/dialog) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/dialog
```

To use yarn:

```bash
yarn add @napacitor/dialog
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Dialog } from '@napacitor/dialog';

await Dialog.alert({ title: '提示', message: 'Hello Napacitor', buttonTitle: '知道了' });

const { value } = await Dialog.confirm({ title: '确认', message: '继续吗?' });
console.log(value); // true / false

const { value: text, cancelled } = await Dialog.prompt({
  title: '输入',
  message: '你的名字?',
  okButtonTitle: '确定',
  cancelButtonTitle: '取消',
});
```

## 实现原理

封装 .NET MAUI 的 [`Page.DisplayAlert` / `DisplayPromptAsync`](https://learn.microsoft.com/dotnet/maui/user-interface/pop-ups) 文档所述 API(alert / confirm 用 `DisplayAlert`,prompt 用 `DisplayPromptAsync`;Windows 上由 MAUI 落到 `ContentDialog`)。对话框必须在 UI 线程弹出,插件内部经 `MainThread.InvokeOnMainThreadAsync` 切换;宿主窗口未创建 / 无页面时抛 `UNAVAILABLE`。该插件是少数需要 `Microsoft.Maui.Controls` 包引用的插件(Page API 属于 Controls 层)。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### alert(options)

显示警告对话框(单按钮)。

| Param       | Type           |
| ----------- | -------------- |
| **`options`** | `AlertOptions` |

**Returns:** `Promise<void>`

### prompt(options)

显示输入对话框;取消时 `value` 为空字符串、`cancelled` 为 `true`。

| Param       | Type            |
| ----------- | --------------- |
| **`options`** | `PromptOptions` |

**Returns:** `Promise<PromptResult>`

### confirm(options)

显示确认对话框。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `ConfirmOptions` |

**Returns:** `Promise<ConfirmResult>`

## Interfaces

### AlertOptions

| Prop              | Type     | Description                                   |
| ----------------- | -------- | --------------------------------------------- |
| **`title`**       | `string` | 对话框标题。                                  |
| **`message`**     | `string` | 对话框消息。                                  |
| **`buttonTitle`** | `string` | 按钮文案(默认 'OK')。                         |

### PromptOptions

| Prop                     | Type     | Description                                                                                                        |
| ------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------ |
| **`title`**              | `string` | 对话框标题。                                                                                                       |
| **`message`**            | `string` | 对话框消息。                                                                                                       |
| **`okButtonTitle`**      | `string` | 确认按钮文案(默认 'OK')。                                                                                          |
| **`cancelButtonTitle`**  | `string` | 取消按钮文案(默认 'Cancel')。                                                                                      |
| **`inputPlaceholder`**   | `string` | 输入框占位提示(映射 `DisplayPromptAsync` 的 placeholder)。MAUI 无 maxLength / keyboard 定制参数,故未暴露。          |
| **`inputText`**          | `string` | 输入框预填文本。                                                                                                   |

### PromptResult

| Prop           | Type      | Description                        |
| -------------- | --------- | ---------------------------------- |
| **`value`**    | `string`  | 输入的文本(取消时为空字符串)。     |
| **`cancelled`** | `boolean` | 是否被取消。                       |

### ConfirmOptions

| Prop                    | Type     | Description                  |
| ----------------------- | -------- | ---------------------------- |
| **`title`**             | `string` | 对话框标题。                 |
| **`message`**           | `string` | 对话框消息。                 |
| **`okButtonTitle`**     | `string` | 确认按钮文案(默认 'OK')。    |
| **`cancelButtonTitle`** | `string` | 取消按钮文案(默认 'Cancel')。 |

### ConfirmResult

| Prop        | Type      | Description            |
| ----------- | --------- | ---------------------- |
| **`value`** | `boolean` | 点击确认按钮时为 `true`。 |
