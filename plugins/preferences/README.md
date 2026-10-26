# @napacitor/preferences

键值持久化存储插件(与 [@capacitor/preferences](https://github.com/ionic-team/capacitor-plugins/tree/main/preferences) 对应)。

## 用法

```ts
import { Preferences } from '@napacitor/preferences';

await Preferences.set({ key: 'name', value: 'Max' });
const { value } = await Preferences.get({ key: 'name' }); // 'Max'
await Preferences.remove({ key: 'name' });
await Preferences.clear();
```

## 结构

- `src/` —— TypeScript 源码(index / definitions / web)
- `dist/` —— 构建产物(CJS + d.ts,已提交)
- `maui/` —— .NET MAUI C# 实现(程序集 `Napacitor.Preferences`,运行时反射自动发现)

原生实现映射:`Preferences.Default.Get / Set / Remove / Clear`(iOS:UserDefaults /
Android:SharedPreferences / Windows:ApplicationData)。

## 与 Capacitor 的差异

- **keys()**:MAUI Preferences 不提供键枚举能力(无任何列出已存在键的 API),
  故本插件不实现 keys();需要键清单请自行维护;
- **clear()**:直接映射 `Preferences.Clear(sharedName)`,清空整个存储组
  (包含非本插件写入的数据);
- **configure({group})**:映射 MAUI 的 `sharedName`(Android 对应 suite;跨应用共享仅在
  Android 有原生语义);web 端映射为 localStorage 键前缀(默认 `napacitor.`);
- **migrate()/removeOld()**:Napacitor 无 Capacitor 2 Storage 迁移源,恒返回空结果 / no-op。
