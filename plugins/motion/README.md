# @napacitor/motion

统一传感器插件,封装 .NET MAUI [`Accelerometer`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/sensors) 文档所述五类传感器 API:

| 传感器 | MAUI 原生类 | 事件名 |
|--------|------------|--------|
| 加速度计 | `Accelerometer` | `accelerometerReading` |
| 陀螺仪 | `Gyroscope` | `gyroscopeReading` |
| 磁力计 | `Magnetometer` | `magnetometerReading` |
| 指南针 | `Compass` | `compassReading` |
| 气压计 | `Barometer` | `barometerReading` |

## 安装方式

To use npm:

```bash
npm install @napacitor/motion
```

To use yarn:

```bash
yarn add @napacitor/motion
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Motion, SensorSpeed } from '@napacitor/motion';

// ── 支持检测(五类传感器)────────────────────────────────────
const accel = (await Motion.isAccelerometerSupported()).supported;
const gyro = (await Motion.isGyroscopeSupported()).supported;
const magneto = (await Motion.isMagnetometerSupported()).supported;
const compass = (await Motion.isCompassSupported()).supported;
const baro = (await Motion.isBarometerSupported()).supported;

// ── 加速度计 ────────────────────────────────────────────────
if (accel) {
  await Motion.startAccelerometer({ speed: SensorSpeed.Game });
  const handle = await Motion.addListener('accelerometerReading', ({ x, y, z }) => {
    console.log(`加速度: x=${x} y=${y} z=${z} (G)`);
  });
  await Motion.stopAccelerometer();
  await handle.remove();
}

// ── 陀螺仪 ──────────────────────────────────────────────────
if (gyro) {
  await Motion.startGyroscope({ speed: SensorSpeed.Ui });
  await Motion.addListener('gyroscopeReading', ({ x, y, z }) => {
    console.log(`角速度: x=${x} y=${y} z=${z} (rad/s)`);
  });
  await Motion.stopGyroscope();
}

// ── 磁力计 ──────────────────────────────────────────────────
if (magneto) {
  await Motion.startMagnetometer();
  await Motion.addListener('magnetometerReading', ({ x, y, z }) => {
    console.log(`磁场: x=${x} y=${y} z=${z} (μT)`);
  });
  await Motion.stopMagnetometer();
}

// ── 指南针 ──────────────────────────────────────────────────
if (compass) {
  await Motion.startCompass();
  await Motion.addListener('compassReading', ({ headingMagnetic, headingTrue, calibration }) => {
    console.log(`磁北: ${headingMagnetic}°  真北: ${headingTrue}°  校准: ${calibration}`);
  });
  await Motion.stopCompass();
}

// ── 气压计 ──────────────────────────────────────────────────
if (baro) {
  await Motion.startBarometer();
  await Motion.addListener('barometerReading', ({ pressure }) => {
    console.log(`气压: ${pressure} hPa`);
  });
  await Motion.stopBarometer();
}

// 移除全部监听
await Motion.removeAllListeners();
```

## 实现原理

封装 .NET MAUI 的 [`Accelerometer / Gyroscope / Magnetometer / Compass / Barometer`](https://learn.microsoft.com/dotnet/maui/platform-integration/device/sensors) 文档所述 API:每种传感器独立管理订阅——首个 JS 监听器注册时订阅原生 `ReadingChanged`,最后一个移除时退订;`start*()` 调用 `Default.Start(speed)`,`stop*()` 调用 `Default.Stop()`。采样速率映射 MAUI `SensorSpeed` 枚举(`DEFAULT` 约 200ms / `UI` 约 60ms / `GAME` 约 40ms / `FASTEST` 约 20ms)。Web 端:加速度计/陀螺仪走 `DeviceMotionEvent`(需 HTTPS 或 localhost),指南针走 `DeviceOrientationEvent`(iOS 需用户授权),磁力计与气压计浏览器无标准 API。

## 权限

### Android

无需额外配置(传感器访问不需要权限声明)。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### isAccelerometerSupported() / isGyroscopeSupported() / isMagnetometerSupported() / isCompassSupported() / isBarometerSupported()

检查对应传感器是否可用。

**Returns:** `Promise<SensorSupportedResult>`

### startAccelerometer(options?) / startGyroscope(options?) / startMagnetometer(options?) / startCompass(options?) / startBarometer(options?)

启动对应传感器监听(设备不支持时抛 `UNSUPPORTED`)。

| Param       | Type                 |
| ----------- | -------------------- |
| **`options`** | `StartSensorOptions` |

**Returns:** `Promise<void>`

### stopAccelerometer() / stopGyroscope() / stopMagnetometer() / stopCompass() / stopBarometer()

停止对应传感器。

**Returns:** `Promise<void>`

### addListener('accelerometerReading', callback) / addListener('gyroscopeReading', callback) / addListener('magnetometerReading', callback)

监听三轴传感器读数(见下表事件名与回调类型)。

| Param        | Type                     |
| ------------ | ------------------------ |
| **`eventName`** | `'accelerometerReading'` / `'gyroscopeReading'` / `'magnetometerReading'` |
| **`callback`**  | `AccelerometerCallback` / `GyroscopeCallback` / `MagnetometerCallback` |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('compassReading', callback)

监听指南针读数。

| Param        | Type               |
| ------------ | ------------------ |
| **`eventName`** | `'compassReading'` |
| **`callback`**  | `CompassCallback`  |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### addListener('barometerReading', callback)

监听气压计读数。

| Param        | Type                 |
| ------------ | -------------------- |
| **`eventName`** | `'barometerReading'` |
| **`callback`**  | `BarometerCallback`  |

**Returns:** `Promise<PluginListenerHandle> & PluginListenerHandle`

### removeAllListeners()

移除该插件全部监听器(每种传感器退订原生事件;正在运行中的传感器请另行调用 `stop*()` 停止)。

**Returns:** `Promise<void>`

## Interfaces

### SensorSupportedResult

| Prop            | Type      | Description          |
| --------------- | --------- | -------------------- |
| **`supported`** | `boolean` | 传感器是否可用。     |

### StartSensorOptions

| Prop        | Type          | Description                                                                                |
| ----------- | ------------- | ------------------------------------------------------------------------------------------ |
| **`speed`** | `SensorSpeed` | 采样速率(默认 `DEFAULT`):`DEFAULT`(约 200ms / 5Hz) / `UI`(约 60ms / ~17Hz) / `GAME`(约 40ms / 25Hz) / `FASTEST`(约 20ms / 50Hz)。 |

### AxisReading

三轴读数(加速度计 / 陀螺仪 / 磁力计共用结构)。

| Prop     | Type     | Description              |
| -------- | -------- | ------------------------ |
| **`x`**  | `number` | X 轴分量(单位依传感器:加速度计 G / 陀螺仪 rad/s / 磁力计 µT)。 |
| **`y`**  | `number` | Y 轴分量(同上)。         |
| **`z`**  | `number` | Z 轴分量(同上)。         |

### CompassReading

| Prop                  | Type                 | Description                                                                                          |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| **`headingMagnetic`** | `number`             | 磁北方向角(0-360°,0=正北,顺时针递增)。                                                               |
| **`headingTrue`**     | `number`             | 真北方向角。MAUI 10 的 `CompassData` 仅提供磁北方向角,原生端恒为 `-1`(不支持时)。                   |
| **`calibration`**     | `CompassCalibration` | 校准精度等级。                                                               |

### BarometerReading

| Prop           | Type     | Description          |
| -------------- | -------- | -------------------- |
| **`pressure`** | `number` | 大气压强(hPa / 百帕)。 |
