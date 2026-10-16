# @napacitor/device

设备基础信息插件(与 [@capacitor/device](https://github.com/ionic-team/capacitor-plugins/tree/main/device) 对应)。

## 用法

```ts
import { Device } from '@napacitor/device';

const info = await Device.getInfo();
// { model, platform, osVersion, manufacturer, isVirtual, name? }

const lang = await Device.getLanguageCode(); // { value: 'zh' }
const locale = await Device.getLocale();     // { value: 'zh-CN' }
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Device`,运行时反射自动发现)

原生实现映射:`DeviceInfo.Current`(Model/Manufacturer/Name/VersionString/DeviceType)、`CultureInfo`。
