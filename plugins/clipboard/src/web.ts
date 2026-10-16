/**
 * @napacitor/clipboard 浏览器实现(与 @capacitor/clipboard 的 web 实现对应)。
 */
import type { ReadResult, WriteOptions } from './definitions';

export class ClipboardWeb {
  async write(options: WriteOptions): Promise<void> {
    if (typeof options.string === 'string') {
      await navigator.clipboard.writeText(options.string);
      return;
    }
    throw new Error('Clipboard.write:浏览器端仅支持写入文本(string)');
  }

  async read(): Promise<ReadResult> {
    return { value: await navigator.clipboard.readText() };
  }
}
