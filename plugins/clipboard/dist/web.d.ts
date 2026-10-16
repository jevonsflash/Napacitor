/**
 * @napacitor/clipboard 浏览器实现(与 @capacitor/clipboard 的 web 实现对应)。
 */
import type { ReadResult, WriteOptions } from './definitions';
export declare class ClipboardWeb {
    write(options: WriteOptions): Promise<void>;
    read(): Promise<ReadResult>;
}
