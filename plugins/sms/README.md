# @napacitor/sms

短信插件,封装 .NET MAUI `Sms` API:发送短信。

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

## API

### isSupported()

检查是否支持发送短信。

**返回:** `Promise<{ supported: boolean }>`

### send(options)

发送短信(打开系统短信客户端)。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.recipients | `string[]` | **必填**。收件人手机号列表 |
| options.body | `string` | 短信正文 |

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Sms`)

原生实现映射:`Sms.Default.ComposeAsync`。
