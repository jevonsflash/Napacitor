# @napacitor/connectivity

网络状态检测与监听插件,封装 .NET MAUI `Connectivity` API。

## 用法

```ts
import { Connectivity } from '@napacitor/connectivity';

// 获取当前网络状态
const status = await Connectivity.getStatus();
console.log(status.connectionType, status.networkAccess, status.isConnected);

// 检查是否有互联网连接
const hasInternet = await Connectivity.hasInternetAccess();

// 监听网络状态变化
const handle = await Connectivity.addListener('connectivityChange', (status) => {
  console.log('网络变化:', status.connectionType, status.isConnected);
});

await handle.remove();
await Connectivity.removeAllListeners();
```

## API

### getStatus()

获取当前网络状态。

**返回:** `Promise<NetworkStatus>`

| 字段 | 类型 | 说明 |
|------|------|------|
| connectionType | `ConnectionType` | 连接类型:`NONE` / `WIFI` / `CELLULAR` / `ETHERNET` / `BLUETOOTH` / `UNKNOWN` |
| networkAccess | `NetworkAccess` | 访问级别:`INTERNET` / `CONSTRAINED_INTERNET` / `LOCAL` / `NONE` / `UNKNOWN` |
| isConnected | `boolean` | 是否有网络 |

### hasInternetAccess()

检查是否有互联网连接。

**返回:** `Promise<boolean>`

### addListener('connectivityChange', callback)

监听网络状态变化。

### removeAllListeners()

移除该插件全部监听器。

## 结构

- `src/` —— TypeScript 源码
- `dist/` —— 构建产物
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Connectivity`)

原生实现映射:`Connectivity.Default.NetworkAccess / ConnectionType / ConnectivityChanged`。
