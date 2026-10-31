# @napacitor/contacts

联系人插件:读取设备上的全部联系人,以及打开系统联系人选择器(封装 .NET MAUI [`Contacts`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/contacts) API)。

## 安装方式

To use npm:

```bash
npm install @napacitor/contacts
```

To use yarn:

```bash
yarn add @napacitor/contacts
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { Contacts } from '@napacitor/contacts';

// ── 读取全部联系人 ─────────────────────────────────────
const contacts = await Contacts.getContacts();
for (const contact of contacts) {
  console.log(contact.displayName, contact.phones, contact.emails);
}

// ── 系统联系人选择器(取消返回 null)─────────────────────
const picked = await Contacts.pickContact();
if (picked) {
  console.log(picked.id, picked.displayName);
  console.log(picked.phones.map((p) => p.phoneNumber));
  console.log(picked.emails.map((e) => e.emailAddress));
}
```

## 实现原理

封装 .NET MAUI 的 [`Contacts.Default`](https://learn.microsoft.com/dotnet/maui/platform-integration/communication/contacts) 门面:`getContacts()` 调 `GetAllAsync()` 读取设备全部联系人(Android 不支持其 `cancellationToken` 参数);`pickContact()` 在 UI 线程调用 `PickContactAsync()` 弹出系统联系人对话框(取消返回 `null`)。C# 侧因 iOS/macOS 存在命名空间冲突,按官方要求以 `Communication` 别名完全限定 `Contacts` 类型;`Contact` 的 `Emails` / `Phones` 集合逐一映射为结果 DTO。

## 权限

### Android

在 *Platforms/Android/AndroidManifest.xml* 中声明 `READ_CONTACTS` 权限:

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

也可在 *Platforms/Android/MainApplication.cs* 中以 `[assembly: UsesPermission(Android.Manifest.Permission.ReadContacts)]` 程序集属性声明。

### iOS

官方文档未要求额外配置。注意:调用 `getContacts()` 读取联系人库时,系统可能要求应用在 *Info.plist* 声明 `NSContactsUsageDescription`(申请权限时向用户展示的原因),否则调用会失败。

### Windows

官方文档:不支持选取联系人,`pickContact()` 抛 `UNSUPPORTED`。

## API

### getContacts()

获取设备上的全部联系人(权限拒绝时抛错)。

**Returns:** `Promise<ContactInfo[]>`

### pickContact()

打开系统联系人选择器选取单个联系人;用户取消时返回 `null`(Windows 不支持,抛 `UNSUPPORTED`)。

**Returns:** `Promise<ContactInfo | null>`

## Interfaces

### ContactInfo

| Prop             | Type            | Description                          |
| ---------------- | --------------- | ------------------------------------ |
| **`id`**         | `string`        | 联系人 ID。                          |
| **`displayName`** | `string`       | 显示名(未设置时由姓名推断)。         |
| **`namePrefix`** | `string`        | 名前缀(如 'Dr.')。                   |
| **`givenName`**  | `string`        | 名。                                 |
| **`middleName`** | `string`        | 中间名。                             |
| **`familyName`** | `string`        | 姓。                                 |
| **`nameSuffix`** | `string`        | 名后缀(如 'Jr.')。                   |
| **`emails`**     | `ContactEmail[]` | 邮箱列表。                           |
| **`phones`**     | `ContactPhone[]` | 电话列表。                           |

### ContactEmail

| Prop               | Type     | Description |
| ------------------ | -------- | ----------- |
| **`emailAddress`** | `string` | 邮箱地址。  |

### ContactPhone

| Prop              | Type     | Description |
| ----------------- | -------- | ----------- |
| **`phoneNumber`** | `string` | 电话号码。  |
