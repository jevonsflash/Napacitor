/**
 * @napacitor/clipboard 类型定义(与 @capacitor/clipboard 对应)。
 */
/** write() 参数。 */
export interface WriteOptions {
    /** 要复制的文本。 */
    string?: string;
    /** 要复制的图像(base64 data URI)。MAUI 端暂未实现,将抛 NOT_IMPLEMENTED。 */
    image?: string;
}
/** read() 返回结构。 */
export interface ReadResult {
    /** 剪贴板中的文本(空剪贴板返回空字符串)。 */
    value: string;
}
export interface ClipboardPlugin {
    /** 写入剪贴板。 */
    write(options: WriteOptions): Promise<void>;
    /** 读取剪贴板文本。 */
    read(): Promise<ReadResult>;
}
