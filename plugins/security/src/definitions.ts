/**
 * @napacitor/security 类型定义。
 * 封装 .NET MAUI SecureStorage API:安全键值存储
 * (iOS:Keychain / Android:EncryptedSharedPreferences+Keystore /
 *  Windows:DataProtectionProvider)。
 */

/** get() 参数。 */
export interface GetOptions {
  /** 要读取的键。 */
  key: string;
}

/** get() 返回值。 */
export interface GetResult {
  /** 键对应的值;未设置过或已删除时为 null。 */
  value: string | null;
}

/** set() 参数。 */
export interface SetOptions {
  /** 要写入的键。 */
  key: string;
  /** 要写入的值(仅支持字符串,复杂对象请自行 JSON.stringify)。 */
  value: string;
}

/** remove() 参数。 */
export interface RemoveOptions {
  /** 要删除的键。 */
  key: string;
}

/** remove() 返回值。 */
export interface RemoveResult {
  /** 是否存在该键并被删除(对应 MAUI SecureStorage.Remove 的返回值)。 */
  success: boolean;
}

export interface SecurityPlugin {
  /** 读取键值。 */
  get(options: GetOptions): Promise<GetResult>;
  /** 写入键值。 */
  set(options: SetOptions): Promise<void>;
  /** 删除指定键。 */
  remove(options: RemoveOptions): Promise<RemoveResult>;
  /** 清空全部安全存储值。 */
  clear(): Promise<void>;
}
