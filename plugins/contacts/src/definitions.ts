/**
 * @napacitor/contacts 类型定义。
 * 读取全部联系人与系统联系人选择器
 * (封装 MAUI Contacts API)。
 */

/** 联系人邮箱(对应 MAUI ContactEmail)。 */
export interface ContactEmail {
  /** 邮箱地址。 */
  emailAddress?: string;
}

/** 联系人电话(对应 MAUI ContactPhone)。 */
export interface ContactPhone {
  /** 电话号码。 */
  phoneNumber?: string;
}

/** 联系人信息(对应 MAUI Contact)。 */
export interface ContactInfo {
  /** 联系人 ID。 */
  id: string;
  /** 显示名(未设置时由姓名推断)。 */
  displayName: string;
  /** 名前缀(如 'Dr.')。 */
  namePrefix?: string;
  /** 名。 */
  givenName?: string;
  /** 中间名。 */
  middleName?: string;
  /** 姓。 */
  familyName?: string;
  /** 名后缀(如 'Jr.')。 */
  nameSuffix?: string;
  /** 邮箱列表。 */
  emails: ContactEmail[];
  /** 电话列表。 */
  phones: ContactPhone[];
}

export interface ContactsPlugin {
  /** 获取设备上的全部联系人(权限拒绝时抛错)。 */
  getContacts(): Promise<ContactInfo[]>;
  /** 打开系统联系人选择器选取单个联系人(取消返回 null;Windows 不支持,抛 UNSUPPORTED)。 */
  pickContact(): Promise<ContactInfo | null>;
}
