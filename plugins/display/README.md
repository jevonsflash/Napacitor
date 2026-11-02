# @napacitor/display

屏幕显示插件:读取屏幕指标、监听屏幕变化、保持屏幕常亮,并支持运行时锁定屏幕方向。

## 安装方式

To use npm:

```bash
npm install @napacitor/display
```

To use yarn:

```bash
yarn add @napacitor/display
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Display } from '@napacitor/display';

// 读取屏幕信息
const info = await Display.getInfo();
// { width, height, density, orientation, rotation, refreshRate }

// 监听屏幕变化(方向/尺寸/密度等)
const handle = await Display.addListener('displayChange', (info) => {
  console.log('屏幕指标变化:', info);
});
// handle.remove()

// 阻止设备锁屏/熄屏
await Display.setKeepAwake({ keepAwake: true });
await Display.setKeepAwake({ keepAwake: false });

// 运行时锁定方向
await Display.lock({ orientation: 'portrait' });
await Display.lock({ orientation: 'landscape' });

// 解锁方向,回落到全局设置
await Display.unlock();
```

## 实现原理

封装 .NET MAUI 的 [`DeviceDisplay`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/display) 文档所述 API:

- `getInfo()` → `DeviceDisplay.Current.MainDisplayInfo`(Width / Height / Density / Orientation / Rotation / RefreshRate);
- `addListener('displayChange')` → `MainDisplayInfoChanged` 事件(任何屏幕指标变化时触发);
- `setKeepAwake()` → `KeepScreenOn`(阻止设备锁屏/熄屏);
- `lock()` / `unlock()` → 运行时方向锁定(见下)。

### 运行时方向锁定的平台实现

| 平台 | 实现 | 说明 |
| --- | --- | --- |
| Android | `Activity.RequestedOrientation` | `Portrait` / `Landscape` / `Unspecified`(解锁,回落到清单的全局设置) |
| iOS / Mac Catalyst | `UIDevice.SetValueForKey("orientation")` + `AttemptRotationToDeviceOrientation` | 遗留运行时方向机制;**iOS 16+ 部分场景可能不生效**;要锁定的方向必须声明在 `Info.plist` 的 `UISupportedInterfaceOrientations` 中 |
| Windows | 不支持 | 抛 `NOT_IMPLEMENTED`;请调整窗口尺寸或使用系统显示设置 |
| Web | Screen Orientation API(`screen.orientation.lock`) | 通常要求全屏或安装为 PWA,否则抛错 |

## 权限

### Android

无需额外配置。方向锁定作用于当前 Activity,不需要 manifest 声明;如需全局方向限制,在 `AndroidManifest.xml` 的主 activity 上设置 `android:screenOrientation`。

### iOS

- 运行时方向锁定要求目标方向已声明在 `Info.plist` 的 `UISupportedInterfaceOrientations`(iPad 为 `UISupportedInterfaceOrientations~ipad`)中;
- 默认情况下 iPad 允许多任务处理,方向无法锁定——在 `Info.plist` 中把 `UIRequiresFullScreen` 设为 `YES` 即可锁定;
- iOS 16+ 中运行时方向机制在部分场景下不生效,如需硬性锁定请配合上述 `Info.plist` 配置。

### Windows

无需额外配置(`getInfo` / `setKeepAwake` / `displayChange` 可用;`lock` / `unlock` 抛 `NOT_IMPLEMENTED`)。

### Web

- `setKeepAwake`:依赖 [Wake Lock API](https://developer.mozilla.org/docs/Web/API/Wake_Lock_API),浏览器不支持时抛错;
- `lock` / `unlock`:依赖 [Screen Orientation API](https://developer.mozilla.org/docs/Web/API/Screen_Orientation_API),通常要求全屏或安装为 PWA;
- `getInfo` 的 `refreshRate` 浏览器不可知,恒为 0。

## API

### getInfo()

获取当前屏幕信息。

**Returns:** `Promise<DisplayInfo>`

### setKeepAwake(options)

设置屏幕是否保持常亮(阻止设备锁屏/熄屏)。

| Param         | Type              |
| ------------- | ----------------- |
| **`options`** | `KeepAwakeOptions` |

**Returns:** `Promise<void>`

### lock(options)

锁定屏幕方向。

| Param         | Type          |
| ------------- | ------------- |
| **`options`** | `LockOptions` |

**Returns:** `Promise<void>`

### unlock()

解锁方向,回落到全局设置。

**Returns:** `Promise<void>`

### addListener('displayChange', ...)

监听屏幕指标变化(方向/尺寸/密度等)。

| Param          | Type                    |
| -------------- | ----------------------- |
| **`eventName`** | `'displayChange'`       |
| **`callback`** | `DisplayChangeCallback` |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器。

**Returns:** `Promise<void>`

## Interfaces

### DisplayInfo

| Prop              | Type                                    | Description                                        |
| ----------------- | --------------------------------------- | -------------------------------------------------- |
| **`width`**       | `number`                                | 像素宽度。                                          |
| **`height`**      | `number`                                | 像素高度。                                          |
| **`density`**     | `number`                                | 屏幕密度(1x = 1.0,2x = 2.0)。                       |
| **`orientation`** | `'portrait' \| 'landscape'`             | 当前方向。                                          |
| **`rotation`**    | `number`                                | 相对自然方向的旋转角度(0 / 90 / 180 / 270)。        |
| **`refreshRate`** | `number`                                | 屏幕刷新率(Hz;平台未知时为 0)。                     |

### KeepAwakeOptions

| Prop            | Type      | Description                                |
| --------------- | --------- | ------------------------------------------ |
| **`keepAwake`** | `boolean` | 是否保持屏幕常亮(阻止设备锁屏/熄屏)。        |

### LockOptions

| Prop              | Type                        | Description                                    |
| ----------------- | --------------------------- | ---------------------------------------------- |
| **`orientation`** | `'portrait' \| 'landscape'` | 要锁定的方向(非法值抛 `INVALID_ARGUMENTS`)。    |
