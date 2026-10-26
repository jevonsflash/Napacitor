# @napacitor/dialog

原生对话框插件(与 [@capacitor/dialog](https://github.com/ionic-team/capacitor-plugins/tree/main/dialog) 对应)。

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

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Dialog`,运行时反射自动发现)

原生实现映射:`Page.DisplayAlert`(alert / confirm)、`Page.DisplayPromptAsync`(prompt);
Windows 上由 MAUI 落到 `ContentDialog`。对话框必须在 UI 线程弹出,插件内部经
`MainThread.InvokeOnMainThreadAsync` 切换。

## 与 Capacitor 的差异

- **alert**:映射 DisplayAlert 的单按钮形态,`buttonTitle` 即按钮文案;
- **prompt**:`inputPlaceholder` 映射 DisplayPromptAsync 的 placeholder,MAUI 无
  maxLength / keyboard 定制参数故未暴露;取消时 `value` 为空字符串;
- **web**:Capacitor 依赖 pwa-elements 渲染样式化弹层,此处用 `window.alert / confirm /
  prompt` 兜底;
- 该插件是少数需要 `Microsoft.Maui.Controls` 包引用的插件(Page API 属于 Controls 层,
  运行时 Napacitor 程序集本身仍保持零 MAUI 依赖)。
