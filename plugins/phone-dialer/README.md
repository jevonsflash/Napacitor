# @napacitor/phone-dialer

电话拨号插件,封装 .NET MAUI `PhoneDialer` API:拨打电话。

## 用法

```ts
import { PhoneDialer } from '@napacitor/phone-dialer';

// 检查是否支持
const { supported } = await PhoneDialer.isSupported();

if (supported) {
  await PhoneDialer.open({ number: '+8613800138000' });
}
```

## API

### isSupported()

检查是否支持拨打电话。

**返回:** `Promise<{ supported: boolean }>`

### open(options)

拨打电话(打开系统拨号界面)。

| 参数 | 类型 | 说明 |
|------|------|------|
| options.number | `string` | **必填**。电话号码 |

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.PhoneDialer`)

原生实现映射:`PhoneDialer.Default.Open`。
