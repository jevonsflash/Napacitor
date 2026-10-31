# @napacitor/action-sheet

原生操作表插件(与 [@capacitor/action-sheet](https://github.com/ionic-team/capacitor-plugins/tree/main/action-sheet) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/action-sheet
```

To use yarn:

```bash
yarn add @napacitor/action-sheet
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { ActionSheet } from '@napacitor/action-sheet';

const { index, canceled } = await ActionSheet.showActions({
  title: '选择操作',
  options: [
    { title: '上传' },
    { title: '分享' },
    { title: '删除', style: ActionSheetButtonStyle.Destructive },
  ],
  cancelable: true,
});
console.log(index, canceled); // 2 false / -1 true(取消)
```

## 实现原理

封装 .NET MAUI 的 [`Page.DisplayActionSheet`](https://learn.microsoft.com/dotnet/maui/user-interface/pop-ups) 文档所述 API,经 `MainThread.InvokeOnMainThreadAsync` 切换到 UI 线程后弹出原生操作表。返回的下标按 `options` 数组顺序,被取消时为 `-1`。Windows 上由 MAUI 落到 `ContentDialog` 风格的选择弹层。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### showActions(options)

显示操作表;被取消时 `index` 为 `-1`、`canceled` 为 `true`。

**Returns:** `Promise<ShowActionsResult>`

| Param       | Type                |
| ----------- | ------------------- |
| **`options`** | `ShowActionsOptions` |

## Interfaces

### ActionSheetButton

| Prop        | Type                        | Description                                                                 |
| ----------- | --------------------------- | --------------------------------------------------------------------------- |
| **`title`** | `string`                    | 按钮文案。                                                                  |
| **`style`** | `ActionSheetButtonStyle`    | 按钮风格。仅 iOS 语义,`DisplayActionSheet` 无对应参数,原生端当前忽略(破坏性按钮样式需平台代码);web 端同样忽略。 |
| **`icon`**  | `string`                    | 按钮图标。仅 web 生效,原生端忽略。                                          |

### ShowActionsOptions

| Prop             | Type                  | Description                                                                                                    |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **`title`**      | `string`              | 操作表标题。                                                                                                   |
| **`message`**    | `string`              | 标题下的消息。仅 iOS 语义,`DisplayActionSheet` 无对应参数,原生端忽略。                                         |
| **`options`**    | `ActionSheetButton[]` | 可选项。不能为空(至少一个带 `title` 的选项),否则抛出 `INVALID_ARGUMENTS`。                                     |
| **`cancelable`** | `boolean`             | 点击表外区域是否可取消(默认 `false`)。为 `true` 时提供 'Cancel' 取消按钮(不传 cancel 时点表外无法收起),点击取消返回 `{index: -1, canceled: true}`。 |

### ShowActionsResult

| Prop           | Type      | Description                          |
| -------------- | --------- | ------------------------------------ |
| **`index`**    | `number`  | 被点击选项的下标(从 0 起);被取消时为 `-1`。 |
| **`canceled`** | `boolean` | 是否被取消。                          |
