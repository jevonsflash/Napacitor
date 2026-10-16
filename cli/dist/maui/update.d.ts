import type { CLIConfig } from '../definitions';
/** 生成的引用描述(供输出报告与渲染 props)。 */
export interface PluginRef {
    /** npm 包名,如 @napacitor/device。 */
    name: string;
    /** csproj 相对宿主目录的 MSBuild Include 路径。 */
    include: string;
}
export declare function updateMaui(config: CLIConfig): Promise<void>;
