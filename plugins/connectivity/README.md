# @napacitor/connectivity

网络状态检测与监听插件,封装 .NET MAUI [`Connectivity`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/networking) API。

## 安装方式

To use npm:

```bash
npm install @napacitor/connectivity
```

To use yarn:

```bash
yarn add @napacitor/connectivity
```

Sync native files:

```bash
npx nap sync
```

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

## 实现原理

封装 .NET MAUI 的 [`Connectivity.Current`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/networking) 门面:`NetworkAccess` 映射访问级别、`ConnectionProfiles` 映射连接类型(优先级 Ethernet > WiFi > Cellular > Bluetooth,空集合为 `NONE`、其余为 `UNKNOWN`)。首个 JS 监听器注册时订阅原生 `ConnectivityChanged`,最后一个移除时退订。注意:平台报告 `Internet` 仅保证存在网络连接,不保证实际可达(如 Wi-Fi 已连但路由器断网)。

## 权限

### Android

需声明 `ACCESS_NETWORK_STATE` 权限(MAUI 文档要求)。在 `AndroidManifest.xml` 添加:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

或在 `Platforms/Android/MainApplication.cs` 添加程序集特性:

```csharp
[assembly: UsesPermission(Android.Manifest.Permission.AccessNetworkState)]
```

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### getStatus()

获取当前网络状态。

**Returns:** `Promise<NetworkStatus>`

### hasInternetAccess()

检查是否有互联网连接(仅当 `NetworkAccess` 为 `Internet` 时为 `true`)。

**Returns:** `Promise<boolean>`

### addListener('connectivityChange', callback)

监听网络状态变化。首个监听器注册时订阅原生事件,最后一个移除后退订。

| Param        | Type                          |
| ------------ | ----------------------------- |
| **`eventName`** | `'connectivityChange'`      |
| **`callback`**  | `ConnectivityChangeCallback` |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### NetworkStatus

| Prop                 | Type             | Description                                                                                        |
| -------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| **`connectionType`** | `ConnectionType` | 连接类型:`NONE` / `WIFI` / `CELLULAR` / `ETHERNET` / `BLUETOOTH` / `UNKNOWN`。                      |
| **`networkAccess`**  | `NetworkAccess`  | 访问级别:`INTERNET` / `CONSTRAINED_INTERNET` / `LOCAL` / `NONE` / `UNKNOWN`。                        |
| **`isConnected`**    | `boolean`        | 是否有网络(便捷字段,`NetworkAccess` 非 `NONE` 即 `true`)。                                          |
