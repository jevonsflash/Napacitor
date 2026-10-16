export { registerPlugin } from './runtime';
export { NapacitorException } from './runtime';
export * from './definitions';
/** Napacitor 全局对象的类型化引用。 */
export declare const Napacitor: {
    isNativePlatform(): boolean;
    getPlatform(): string;
    isPluginAvailable(name: string): boolean;
    convertFileUri(uri: string): string;
    registerPlugin<T extends Record<string, any>>(name: string, impls?: {
        web?: unknown;
    }): T;
    readonly version: string;
};
