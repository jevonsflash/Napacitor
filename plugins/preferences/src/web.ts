/**
 * @napacitor/preferences 浏览器实现(基于 localStorage,
 * 与 @capacitor/preferences 的 web 实现对应)。
 * group 通过键前缀实现,默认前缀 'napacitor.'。
 */
import type {
  ConfigureOptions,
  GetOptions,
  GetResult,
  MigrateResult,
  PreferencesPlugin,
  RemoveOptions,
  SetOptions,
} from './definitions';

const DEFAULT_PREFIX = 'napacitor.';

export class PreferencesWeb implements PreferencesPlugin {
  private _prefix = DEFAULT_PREFIX;

  private _fullKey(key: string): string {
    return this._prefix + key;
  }

  async configure(options: ConfigureOptions): Promise<void> {
    this._prefix = options.group ? `${options.group}.` : DEFAULT_PREFIX;
  }

  async get(options: GetOptions): Promise<GetResult> {
    return { value: localStorage.getItem(this._fullKey(options.key)) };
  }

  async set(options: SetOptions): Promise<void> {
    localStorage.setItem(this._fullKey(options.key), options.value);
  }

  async remove(options: RemoveOptions): Promise<void> {
    localStorage.removeItem(this._fullKey(options.key));
  }

  async clear(): Promise<void> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this._prefix)) {
        keys.push(key);
      }
    }
    keys.forEach((k) => localStorage.removeItem(k));
  }

  async migrate(): Promise<MigrateResult> {
    // Napacitor 无 Capacitor 2 Storage 迁移源
    return { migrated: [], existing: [] };
  }

  async removeOld(): Promise<void> {
    // no-op(Napacitor 无 '_cap_' 前缀旧数据)
  }
}
