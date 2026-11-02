# @napacitor/security

安全键值存储插件:用操作系统级安全设施保存机密值(认证令牌、加密密钥等)。

## 安装方式

To use npm:

```bash
npm install @napacitor/security
```

To use yarn:

```bash
yarn add @napacitor/security
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Security } from '@napacitor/security';

await Security.set({ key: 'oauth_token', value: 'secret-oauth-token-value' });

const { value } = await Security.get({ key: 'oauth_token' }); // 'secret-oauth-token-value'
// 键不存在时 value 为 null

const { success } = await Security.remove({ key: 'oauth_token' }); // { success: true }
await Security.clear(); // 清空全部安全存储值
```

## 实现原理

封装 .NET MAUI 的 [`SecureStorage`](https://learn.microsoft.com/dotnet/maui/platform-integration/storage/secure-storage) 文档所述 API:`SecureStorage.Default.GetAsync / SetAsync / Remove / RemoveAll`。

平台底层实现:

- **iOS / Mac Catalyst**:Keychain(`SecRecord` 的 Service 值为 `[YOUR-APP-BUNDLE-ID].microsoft.maui.essentials.preferences`);
- **Android**:`EncryptedSharedPreferences`(Android Security 库)——键确定性加密、值以 AES-256 GCM 非确定性加密,密钥由 Android Keystore 保护;
- **Windows**:`DataProtectionProvider` 加密;打包应用存于 `ApplicationData.Current.LocalSettings` 的 `[YOUR-APP-ID].microsoft.maui.essentials.preferences` 容器,未打包应用存于应用数据文件夹的 `securestorage.dat`;
- **Web**:浏览器无硬件级安全存储,降级为 `localStorage` 占位实现(**明文,不安全**,仅供开发调试,切勿在生产 web 端保存机密)。

该 API 设计用于存储少量文本,存储大量文本会影响性能。

## 权限

### Android

无需额外配置。但要注意 **Auto Backup**:应用数据(含加密后的 `SharedPreferences`)会随 Google 云备份恢复,而加密密钥不会随备份迁移,恢复后旧值无法解密——MAUI 会自动移除受影响的键,但对仍缓存的损坏值调用 `get()` 可能抛异常。推荐任选其一:

- 在 `AndroidManifest.xml` 中设置 `android:allowBackup="false"`;或
- 用 `android:fullBackupContent` 指向自定义规则集,排除 `sharedpref` 域的 `${applicationId}.microsoft.maui.essentials.preferences.xml`。

### iOS

- **模拟器**开发时必须启用 Keychain entitlement 并为 bundle identifier 添加 Keychain 访问组(编辑 `Entitlements.plist`,并在 iOS Bundle Signing 的 Custom Entitlements 中指定);
- **真机**部署不需要该 entitlement,应将其移除;
- 卸载应用**不会**删除 Keychain 条目,重装后仍可读取旧值。设备转售/共享前,建议在首次启动时检查 first-launch 标志并调用 `clear()`:

```ts
import { Preferences } from '@napacitor/preferences';
import { Security } from '@napacitor/security';

const { value } = await Preferences.get({ key: 'app_initialized' });
if (value === null) {
  await Security.clear();
  await Preferences.set({ key: 'app_initialized', value: 'true' });
}
```

- 若用户启用了 iCloud Keychain,写入的 Keychain 值可能静默同步到其其他 Apple 设备(无法从 .NET MAUI 控制)。

### Windows

无需额外配置。注意 `LocalSettings` 的限制:设置名最长 255 字符,单个设置最大 8K 字节,复合设置最大 64K 字节。

## 错误处理

`get()` / `set()` 可能因设备不支持安全存储、加密密钥变更或数据损坏而抛出异常(错误码 `ERROR`,消息附带指引)。推荐在应用侧捕获后调用 `clear()` 清空重建,再由用户重新录入或重新获取令牌:

```ts
try {
  const { value } = await Security.get({ key: 'auth_token' });
} catch (e) {
  // 设备无法解密已存储的值(如备份恢复后)——清空后重新获取
  await Security.clear();
}
```

## API

### get(options)

读取键值。

| Param         | Type        |
| ------------- | ----------- |
| **`options`** | `GetOptions` |

**Returns:** `Promise<GetResult>`

### set(options)

写入键值。

| Param         | Type        |
| ------------- | ----------- |
| **`options`** | `SetOptions` |

**Returns:** `Promise<void>`

### remove(options)

删除指定键。

| Param         | Type           |
| ------------- | -------------- |
| **`options`** | `RemoveOptions` |

**Returns:** `Promise<RemoveResult>`

### clear()

清空全部安全存储值(注意:直接映射 `SecureStorage.RemoveAll()`,清空的是 SecureStorage 的整个存储域)。

**Returns:** `Promise<void>`

## Interfaces

### GetOptions

| Prop      | Type     | Description                                          |
| --------- | -------- | ---------------------------------------------------- |
| **`key`** | `string` | 要读取的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。     |

### GetResult

| Prop        | Type             | Description                              |
| ----------- | ---------------- | ---------------------------------------- |
| **`value`** | `string \| null` | 键对应的值;未设置过或已删除时为 `null`。 |

### SetOptions

| Prop        | Type     | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| **`key`**   | `string` | 要写入的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。             |
| **`value`** | `string` | 要写入的值(仅支持字符串,复杂对象请自行 `JSON.stringify`)。   |

### RemoveOptions

| Prop      | Type     | Description                                          |
| --------- | -------- | ---------------------------------------------------- |
| **`key`** | `string` | 要删除的键(不能为空,否则抛 `INVALID_ARGUMENTS`)。     |

### RemoveResult

| Prop          | Type      | Description                                                    |
| ------------- | --------- | -------------------------------------------------------------- |
| **`success`** | `boolean` | 键是否存在并被删除(对应 `SecureStorage.Remove` 的返回值)。      |
