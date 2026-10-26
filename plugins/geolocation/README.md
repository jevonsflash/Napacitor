# @napacitor/geolocation

GPS 定位与持续监听插件(与 [@capacitor/geolocation](https://github.com/ionic-team/capacitor-plugins/tree/main/geolocation) 对应)。

## 用法

```ts
import { Geolocation } from '@napacitor/geolocation';

// 一次性定位
const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
});
console.log(position.coords.latitude, position.coords.longitude);

// 权限
const status = await Geolocation.checkPermissions();
await Geolocation.requestPermissions();

// 持续监听(收到 Position 或 {code, message} 错误)
const id = await Geolocation.watchPosition({}, (position, err) => {
  if (err) { console.error(err); return; }
  console.log(position?.coords);
});
await Geolocation.clearWatch({ id });
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Geolocation`,运行时反射自动发现)

原生实现映射:`Geolocation.Default.GetLocationAsync`(getCurrentPosition)、
`StartListeningForegroundAsync / StopListeningAsync + LocationChanged 事件`(watchPosition)、
`Permissions.Default.CheckStatusAsync / RequestAsync<Permissions.LocationWhenInUse>`(权限)。

## 与 Capacitor 的差异

- **watchPosition**:Capacitor 的回调式 watch 在 Napacitor 上映射为"原生 `watchPosition`
  方法 + `position` / `error` 事件管线"(与 Motion 插件同形);入口层已封装成
  Capacitor 同形的 `(options, callback) => Promise<CallbackID>` 签名;
- **单会话**:MAUI Geolocation 仅支持一个前台监听会话,重复 `watchPosition` 会以新参数
  重启并返回新 id;web 环境直接走 `navigator.geolocation`(id 带 `web.` 前缀);
- **checkPermissions/requestPermissions**:MAUI 未区分粗略/精细位置粒度,
  `coarseLocation` 与 `location` 同值;`maximumAge` 仅 web 生效,原生端忽略。

## 宿主配置要求

- **Android**:`Platforms/Android/AndroidManifest.xml` 需声明
  `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`
  (高精度再声明 `ACCESS_FINE_LOCATION`);
- **iOS**:`Platforms/iOS/Info.plist` 需声明 `NSLocationWhenInUseUsageDescription`。
