# @napacitor/action-sheet

原生操作表插件(与 [@capacitor/action-sheet](https://github.com/ionic-team/capacitor-plugins/tree/main/action-sheet) 对应)。

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

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.ActionSheet`,运行时反射自动发现)

原生实现映射:`Page.DisplayActionSheet`(Windows 上由 MAUI 落到 `ContentDialog` 风格的
选择弹层)。返回的下标按 `options` 数组顺序,被取消时为 `-1`。

## 与 Capacitor 的差异

- **style / message / icon**:仅 iOS / web 有语义,MAUI 的 DisplayActionSheet 无对应
  参数,原生端当前忽略(破坏性按钮样式需平台代码);
- **cancelable**:为 true 时提供 'Cancel' 取消按钮,点击取消返回 `{index: -1, canceled: true}`;
- **web**:Capacitor 依赖 pwa-elements 渲染样式化操作表,Napacitor 0.1 暂无对应 UI
  元素,调用时抛出不支持错误;
- 该插件需要 `Microsoft.Maui.Controls` 包引用(Page API 属于 Controls 层)。
