# @napacitor/email

电子邮件插件,封装 .NET MAUI `Email` API:编写并发送邮件。

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

## API

### isSupported()

检查是否支持发送邮件。

**返回:** `Promise<{ supported: boolean }>`

### compose(options?)

编写并发送邮件(打开系统邮件客户端)。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.to | `string[]` | 收件人列表 |
| options.cc | `string[]` | 抄送列表 |
| options.bcc | `string[]` | 密送列表 |
| options.subject | `string` | 邮件主题 |
| options.body | `string` | 邮件正文 |
| options.isHtml | `boolean` | 是否为 HTML 格式 |
| options.attachments | `string[]` | 附件文件路径 |

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Email`)

原生实现映射:`Email.Default.ComposeAsync`。
