# @napacitor/preferences

键值持久化存储插件(与 [@capacitor/preferences](https://github.com/ionic-team/capacitor-plugins/tree/main/preferences) 对应)。

## 安装方式

To use npm:

```bash
npm install @napacitor/preferences
```

To use yarn:

```bash
yarn add @napacitor/preferences
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Preferences } from '@napacitor/preferences';

// 可选:配置存储组(后续读写清除均作用于该组;省略时使用默认存储)
await Preferences.configure({ group: 'session' });

await Preferences.set({ key: 'name', value: 'Max' });
const { value } = await Preferences.get({ key: 'name' }); // 'Max'
await Preferences.remove({ key: 'name' });
await Preferences.clear();

// Capacitor 2 Storage 兼容(Napacitor 无迁移源:migrate 返回空结果,removeOld 为 no-op)
const { migrated, existing } = await Preferences.migrate(); // { migrated: [], existing: [] }
await Preferences.removeOld();
```

## 实现原理

封装 .NET MAUI 的 [`Preferences`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/preferences) 文档所述 API:`Preferences.Default.Get / Set / Remove / Clear`(iOS:`UserDefaults` / Android:`SharedPreferences` / Windows:`ApplicationData`)。`configure({group})` 映射 MAUI 的 `sharedName`(Android 对应 suite;跨应用共享仅在 Android 有原生语义),作用于后续全部读写清除;web 端映射为 localStorage 键前缀(默认 `napacitor.`)。MAUI Preferences 不提供键枚举能力,故本插件不提供 `keys()`(需要键清单请自行维护)。

## 权限

### Android

无需额外配置。

### iOS

无需额外配置。

### Windows

无需额外配置。

## API

### configure(options)

运行时配置存储组(后续读写清除均作用于该组)。

| Param       | Type               |
| ----------- | ------------------ |
| **`options`** | `ConfigureOptions` |

**Returns:** `Promise<void>`

### get(options)

读取键值。

| Param       | Type        |
| ----------- | ----------- |
| **`options`** | `GetOptions` |

**Returns:** `Promise<GetResult>`

### set(options)

写入键值。

| Param       | Type        |
| ----------- | ----------- |
| **`options`** | `SetOptions` |

**Returns:** `Promise<void>`

### remove(options)

删除指定键。

| Param       | Type           |
| ----------- | -------------- |
| **`options`** | `RemoveOptions` |

**Returns:** `Promise<void>`

### clear()

清空当前存储组(注意:直接映射 `Preferences.Clear(sharedName)`,清空整个存储组,包含非本插件写入的数据)。

**Returns:** `Promise<void>`

### migrate()

从 Capacitor 2 Storage 迁移。Napacitor 无迁移源,恒返回空结果。

**Returns:** `Promise<MigrateResult>`

### removeOld()

删除 Capacitor 2 Storage 的旧数据(Napacitor 无迁移源,no-op)。

**Returns:** `Promise<void>`

## Interfaces

### ConfigureOptions

| Prop        | Type     | Description                                                                             |
| ----------- | -------- | --------------------------------------------------------------------------------------- |
| **`group`** | `string` | 存储组名(映射 MAUI Preferences 的 sharedName);省略时使用默认存储。                      |

### GetOptions

| Prop      | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| **`key`** | `string` | 要读取的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。 |

### GetResult

| Prop        | Type               | Description                    |
| ----------- | ------------------ | ------------------------------ |
| **`value`** | `string \| null`   | 键对应的值;未设置过或已删除时为 `null`。 |

### SetOptions

| Prop        | Type     | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| **`key`**   | `string` | 要写入的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。             |
| **`value`** | `string` | 要写入的值(仅支持字符串,复杂对象请自行 `JSON.stringify`)。   |

### RemoveOptions

| Prop      | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| **`key`** | `string` | 要删除的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。 |

### MigrateResult

| Prop           | Type       | Description                                                |
| -------------- | ---------- | ---------------------------------------------------------- |
| **`migrated`** | `string[]` | 已迁移的键。Napacitor 无 Capacitor 2 Storage 迁移源,恒为空。 |
| **`existing`** | `string[]` | 已存在的键(同上,恒为空)。                                   |
