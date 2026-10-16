import type { CLIConfig } from '../definitions';
export declare function copyMaui(config: CLIConfig): Promise<void>;
/**
 * index.html 宿主化改造:
 * 返回改造后的 HTML 与被摘除的本地脚本路径列表(按文档序)。
 */
export declare function transformIndexHtml(html: string): {
    html: string;
    entries: string[];
};
