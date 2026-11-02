/**
 * @napacitor/security 浏览器实现(基于 localStorage)。
 *
 * ⚠ 安全警告:浏览器没有 iOS Keychain / Android Keystore 之类的
 * 硬件级安全存储,localStorage 是明文持久化,任何脚本都可读取。
 * 本实现仅为开发调试与 web 演示的占位,生产环境切勿在 web 端
 * 用它保存机密(敏感数据请只在内存中处理或走服务端)。
 * 键前缀 'napacitor.' 与其他 @napacitor 插件的 web 实现保持一致。
 */
import type {
  GetOptions,
  GetResult,
  RemoveOptions,
  RemoveResult,
  SecurityPlugin,
  SetOptions,
} from './definitions';

const DEFAULT_PREFIX = 'napacitor.';

export class SecurityWeb implements SecurityPlugin {
  private _prefix = DEFAULT_PREFIX;

  private _fullKey(key: string): string {
    return this._prefix + key;
  }

  async get(options: GetOptions): Promise<GetResult> {
    return { value: localStorage.getItem(this._fullKey(options.key)) };
  }

  async set(options: SetOptions): Promise<void> {
    localStorage.setItem(this._fullKey(options.key), options.value);
  }

  async remove(options: RemoveOptions): Promise<RemoveResult> {
    const fullKey = this._fullKey(options.key);
    const success = localStorage.getItem(fullKey) !== null;
    localStorage.removeItem(fullKey);
    return { success };
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
}
