# @napacitor/motion

统一传感器插件,封装 .NET MAUI 五类传感器 API:

| 传感器 | MAUI 原生类 | 事件名 |
|--------|------------|--------|
| 加速度计 | `Accelerometer` | `accelerometerReading` |
| 陀螺仪 | `Gyroscope` | `gyroscopeReading` |
| 磁力计 | `Magnetometer` | `magnetometerReading` |
| 指南针 | `Compass` | `compassReading` |
| 气压计 | `Barometer` | `barometerReading` |

## 用法

```ts
import { Motion, SensorSpeed } from '@napacitor/motion';

// ── 加速度计 ────────────────────────────────────────────────
const { supported } = await Motion.isAccelerometerSupported();
if (supported) {
  await Motion.startAccelerometer({ speed: SensorSpeed.Game });
  const handle = await Motion.addListener('accelerometerReading', ({ x, y, z }) => {
    console.log(`加速度: x=${x} y=${y} z=${z} (G)`);
  });
  // ...
  await Motion.stopAccelerometer();
  await handle.remove();
}

// ── 指南针 ──────────────────────────────────────────────────
await Motion.startCompass();
await Motion.addListener('compassReading', ({ headingMagnetic, headingTrue, calibration }) => {
  console.log(`磁北: ${headingMagnetic}°  真北: ${headingTrue}°  校准: ${calibration}`);
});

// ── 气压计 ──────────────────────────────────────────────────
await Motion.startBarometer();
await Motion.addListener('barometerReading', ({ pressure }) => {
  console.log(`气压: ${pressure} hPa`);
});

// 移除全部监听
await Motion.removeAllListeners();
```

## API

### 支持检测

| 方法 | 返回 |
|------|------|
| `isAccelerometerSupported()` | `Promise<{ supported: boolean }>` |
| `isGyroscopeSupported()` | `Promise<{ supported: boolean }>` |
| `isMagnetometerSupported()` | `Promise<{ supported: boolean }>` |
| `isCompassSupported()` | `Promise<{ supported: boolean }>` |
| `isBarometerSupported()` | `Promise<{ supported: boolean }>` |

### 启动 / 停止

每种传感器均提供 `start*(options?)` 与 `stop*()` 方法:

| 启动 | 停止 |
|------|------|
| `startAccelerometer(options?)` | `stopAccelerometer()` |
| `startGyroscope(options?)` | `stopGyroscope()` |
| `startMagnetometer(options?)` | `stopMagnetometer()` |
| `startCompass(options?)` | `stopCompass()` |
| `startBarometer(options?)` | `stopBarometer()` |

**`StartSensorOptions`:**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| speed | `SensorSpeed` | `DEFAULT` | `DEFAULT`(200ms) / `UI`(60ms) / `GAME`(40ms) / `FASTEST`(20ms) |

### 事件监听

| 事件名 | 回调参数类型 | 字段 |
|--------|-------------|------|
| `accelerometerReading` | `AxisReading` | `x, y, z` (单位: G) |
| `gyroscopeReading` | `AxisReading` | `x, y, z` (单位: rad/s) |
| `magnetometerReading` | `AxisReading` | `x, y, z` (单位: µT) |
| `compassReading` | `CompassReading` | `headingMagnetic, headingTrue` (度), `calibration` |
| `barometerReading` | `BarometerReading` | `pressure` (hPa) |

### removeAllListeners()

移除该插件全部监听器并停止所有活跃传感器。

## 浏览器兼容性

| 传感器 | Web API | 备注 |
|--------|---------|------|
| 加速度计 | `DeviceMotionEvent` | 需 HTTPS 或 localhost |
| 陀螺仪 | `DeviceMotionEvent` | 同上 |
| 指南针 | `DeviceOrientationEvent` | iOS 需用户授权 |
| 磁力计 | — | 浏览器无标准 API |
| 气压计 | — | 浏览器无标准 API |

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Motion`)

原生实现映射:
- `Accelerometer.Default.Start / Stop / ReadingChanged`
- `Gyroscope.Default.Start / Stop / ReadingChanged`
- `Magnetometer.Default.Start / Stop / ReadingChanged`
- `Compass.Default.Start / Stop / ReadingChanged`
- `Barometer.Default.Start / Stop / ReadingChanged`
