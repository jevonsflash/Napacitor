/**
 * @napacitor/preferences 类型定义。
 * 封装 .NET MAUI Preferences API:键值持久化存储
 * (iOS:UserDefaults / Android:SharedPreferences / Windows:ApplicationData)。
 */

/** configure() 参数。 */
export interface ConfigureOptions {
  /** 存储组名(映射 MAUI Preferences 的 sharedName);省略时使用默认存储。 */
  group?: string;
}

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

/** migrate() 返回值。 */
export interface MigrateResult {
  /** 已迁移的键(Napacitor 无 Capacitor 2 Storage 迁移源,恒为空)。 */
  migrated: string[];
  /** 已存在的键(同上,恒为空)。 */
  existing: string[];
}

export interface PreferencesPlugin {
  /** 运行时配置存储组(后续读写清除均作用于该组)。 */
  configure(options: ConfigureOptions): Promise<void>;
  /** 读取键值。 */
  get(options: GetOptions): Promise<GetResult>;
  /** 写入键值。 */
  set(options: SetOptions): Promise<void>;
  /** 删除指定键。 */
  remove(options: RemoveOptions): Promise<void>;
  /** 清空当前存储组。 */
  clear(): Promise<void>;
  /** 从 Capacitor 2 Storage 迁移(Napacitor 无迁移源,返回空结果)。 */
  migrate(): Promise<MigrateResult>;
  /** 删除 Capacitor 2 Storage 的旧数据(no-op)。 */
  removeOld(): Promise<void>;
}
