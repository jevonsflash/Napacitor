# @napacitor/local-notification

本地通知插件(与 [@capacitor/local-notifications](https://github.com/ionic-team/capacitor-plugins/tree/main/local-notifications) 对应):立即或定时发送系统通知,支持权限请求、取消与点击回调。

## 安装方式

To use npm:

```bash
npm install @napacitor/local-notification
```

To use yarn:

```bash
yarn add @napacitor/local-notification
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { LocalNotification } from '@napacitor/local-notification';

// 请求通知权限(Android 13+ / iOS / Mac Catalyst 弹系统对话框)
const status = await LocalNotification.requestPermission();
// { granted: true }

// 立即发送
const result = await LocalNotification.schedule({
  notifications: [{ title: '提醒', body: '该喝水了', id: 1 }],
});
// { notifications: [{ id: 1 }] }

// 定时发送(ISO 8601 时间)
await LocalNotification.schedule({
  notifications: [{ title: '会议', body: '15:00 开会', id: 2, at: '2026-11-03T15:00:00Z' }],
});

// 取消
await LocalNotification.cancel({ notifications: [{ id: 1 }] });

// 点击通知回调
const handle = await LocalNotification.addListener('notificationReceived', (payload) => {
  console.log(payload.id, payload.title, payload.body);
});

await handle.remove();
await LocalNotification.removeAllListeners();
```

## 实现原理

封装 [.NET MAUI 本地通知文档](https://learn.microsoft.com/dotnet/maui/platform-integration/local-notifications) 所述各平台 API:

- **Android**:`NotificationManager` + `NotificationChannel`(API 26+)立即发送;`AlarmManager` + `BroadcastReceiver` 定时发送;`Permissions.PostNotifications`(API 33+)运行时权限;排期持久化到 `Preferences`,`RECEIVE_BOOT_COMPLETED` 广播在设备重启后自动恢复未到期的闹钟。
- **iOS / Mac Catalyst**:共享 `UNUserNotificationCenter` 实现 —— `UNTimeIntervalNotificationTrigger`(立即)/ `UNCalendarNotificationTrigger`(定时)+ `UNUserNotificationCenterDelegate` 处理前台展示与点击。
- **Windows**:`AppNotificationManager`(`AppNotificationBuilder` 构造、`NotificationInvoked` 接收点击)。

本插件是 Napacitor 中唯一的**多目标**插件(`net10.0;net10.0-android;net10.0-ios;net10.0-maccatalyst;net10.0-windows10.0.19041.0`):通知必须实现平台回调类型(Apple 的 `UNUserNotificationCenterDelegate`、Android 的 `BroadcastReceiver`、Windows 的 `AppNotificationManager.NotificationInvoked`),这些类型只在平台 TFM 中可用;`net10.0` 目标提供桩实现(方法抛 `NOT_IMPLEMENTED`),保证未安装平台工作负载的环境仍可编译。

点击路由:平台回调 → 静态 `Route(id, title, body)` → 已有 JS 监听器立即投递,否则入队,首个监听器注册(`OnListenerAdded`)时统一补投,点击不丢。

Android 点击到达路径(仅冷启动):
- **冷启动**(应用被杀):载荷在 `Activity.Intent`,插件订阅 `Platform.ActivityStateChanged` 在首个 Activity 创建后解析路由(插件构造早于 Activity 创建,故不能直接读 `CurrentActivity`);
- **热启动**(应用在前台):载荷经 `OnNewIntent` 到达,MAUI 未提供插件可订阅的通道(`Platform.OnNewIntent` 是仅供 AppActions 的静态方法),暂不支持,见下方局限。

## 权限

### Android

- `POST_NOTIFICATIONS`:Android 13(API 33)+ 需运行时请求 —— 已通过 `[assembly: UsesPermission]` 自动并入宿主 `AndroidManifest.xml`,调用 `requestPermission()` 弹系统对话框;更低版本恒 granted。
- `RECEIVE_BOOT_COMPLETED`:重启后恢复排期所需,已自动并入 manifest,无需用户授权。

### iOS / Mac Catalyst

调用 `requestPermission()` 触发系统授权对话框(Alert / Sound / Badge)。

### Windows

无运行时权限请求,是否展示由系统「通知设置」决定;`requestPermission()` 恒返回 granted。

## 平台说明

| 能力           | Android                                | iOS / Mac Catalyst            | Windows                                    | Web |
| -------------- | -------------------------------------- | ----------------------------- | ------------------------------------------ | --- |
| 立即通知       | ✅                                     | ✅(0.25s 时间触发器)          | ✅                                         | ✅ |
| 定时通知       | ✅(`AlarmManager`)                     | ✅(`UNCalendarNotificationTrigger`) | ❌(Windows App SDK 不支持,抛 `NOT_IMPLEMENTED`) | ✅(`setTimeout`) |
| 点击回调       | ⚠️ 冷启动 ✅ / 热启动 ❌               | ✅(前台/后台/杀死态)          | ✅(`NotificationInvoked`)                  | ✅ |
| 重启恢复排期   | ✅(持久化 + BootReceiver)              | ✅(系统持久化,无需处理)       | —                                          | — |

## 局限

- **Windows 定时通知**:Windows App SDK 尚未提供计划通知能力,`schedule()` 的 `at` 非空时抛错,参见 [功能请求 #5050](https://github.com/microsoft/WindowsAppSDK/issues/5050)。
- **Android 热启动点击**:应用在前台时点击通知,载荷经 `OnNewIntent` 到达,但 MAUI 未向插件提供可订阅的通道(`Platform.OnNewIntent` 是仅供 AppActions 的静态方法),该场景不触发 `notificationReceived`。若需要,须在 Napacitor 宿主模板中引入通用 `OnNewIntent` 转发机制(参考 app-actions 插件的 `ConfigureEssentials` 转发模式)。
- **Android 设备重启**:重启后仅恢复**未到期**的排期(已过期的不再补发);恢复依赖 `RECEIVE_BOOT_COMPLETED` 广播,极少数国产 ROM 需用户在系统设置中允许应用自启动。
- **iOS / Mac Catalyst 冷启动点击**:系统要求通知代理在应用 `didFinishLaunching` 返回前注册才会回调点击响应。本插件在 `CreateMauiApp`(即 `FinishedLaunching` 内部)构造并注册 `UNUserNotificationCenterDelegate`,时序满足,冷启动点击可正常路由;且 JS 监听器晚到有 Pending 队列兜底。

## API

### requestPermission()

请求发送本地通知的权限(Windows 为 no-op)。

**Returns:** `Promise<PermissionStatus>`

### schedule(options)

立即或定时发送本地通知,返回每条通知的最终 id。

| Param       | Type              |
| ----------- | ----------------- |
| **`options`** | `ScheduleOptions` |

**Returns:** `Promise<ScheduleResult>`

### cancel(options)

取消已排期/已展示的通知。

| Param       | Type             |
| ----------- | ---------------- |
| **`options`** | `CancelOptions`  |

**Returns:** `Promise<void>`

### addListener('notificationReceived', callback)

监听用户点击通知(应用被唤起或已在前台时触发)。

| Param          | Type                         |
| -------------- | ---------------------------- |
| **`eventName`** | `'notificationReceived'`     |
| **`callback`**  | `NotificationReceivedCallback` |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### LocalNotificationSchema

| Prop      | Type     | Description                                          |
| --------- | -------- | ---------------------------------------------------- |
| **`title`** | `string` | 通知标题。                                           |
| **`body`**  | `string` | 通知正文。                                           |
| **`id`**    | `number` | 通知唯一 id(用于取消与点击回调);省略时自动生成。     |
| **`at`**    | `string` | 计划发送时间(ISO 8601);省略时立即发送。              |

### ScheduleOptions

| Prop                | Type                       |
| ------------------- | -------------------------- |
| **`notifications`** | `LocalNotificationSchema[]` |

### ScheduleResult

| Prop                | Type                      |
| ------------------- | ------------------------- |
| **`notifications`** | `ScheduledNotification[]` |

### ScheduledNotification

| Prop     | Type     | Description              |
| -------- | -------- | ------------------------ |
| **`id`** | `number` | 通知 id(自动生成时为分配值)。 |

### CancelOptions

| Prop                | Type                         |
| ------------------- | ---------------------------- |
| **`notifications`** | `CancelNotificationSchema[]` |

### CancelNotificationSchema

| Prop     | Type     | Description          |
| -------- | -------- | -------------------- |
| **`id`** | `number` | 要取消的通知 id。    |

### PermissionStatus

| Prop        | Type      | Description                |
| ----------- | --------- | -------------------------- |
| **`granted`** | `boolean` | 是否已获得通知权限。       |

### NotificationReceived

| Prop      | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| **`id`**    | `number` | 通知 id(平台无法提供时为 0)。 |
| **`title`** | `string` | 通知标题。                     |
| **`body`**  | `string` | 通知正文。                     |
