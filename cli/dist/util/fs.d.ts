/** 路径是否存在。 */
export declare function pathExists(target: string): Promise<boolean>;
/** 读取文本文件(utf8)。 */
export declare function readTextFile(file: string): Promise<string>;
/** 读取 JSON 文件;文件不存在返回 null,解析失败抛出原错误。 */
export declare function readJsonFile<T>(file: string): Promise<T | null>;
/** 写文本文件(自动创建父目录)。 */
export declare function writeTextFile(file: string, data: string): Promise<void>;
/** 递归列出目录下全部文件的相对路径(相对 dir)。 */
export declare function listFilesRecursive(dir: string): Promise<string[]>;
/** 递归复制目录(覆盖同名文件)。 */
export declare function copyDir(src: string, dest: string): Promise<void>;
/** 清空目录(删除全部内容后重建空目录)。 */
export declare function emptyDir(dir: string): Promise<void>;
export declare function replaceTokensInTree(dir: string, tokens: Record<string, string>): Promise<void>;
