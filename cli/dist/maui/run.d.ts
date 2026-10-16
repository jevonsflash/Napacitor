/**
 * `nap run maui`:构建并运行宿主工程(与 Capacitor CLI 的 run.ts 对应)。
 * 底层执行 `dotnet build <宿主> -t:Run -f <TFM> -c <Debug|Release>`。
 */
import type { CLIConfig, RunOptions } from '../definitions';
export declare function runMaui(config: CLIConfig, options: RunOptions): Promise<void>;
