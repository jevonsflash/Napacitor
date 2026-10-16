import type { ImpactOptions, NotificationOptions, VibrateOptions } from './definitions';
export declare class HapticsWeb {
    impact(options?: ImpactOptions): Promise<void>;
    notification(options?: NotificationOptions): Promise<void>;
    vibrate(options?: VibrateOptions): Promise<void>;
    selection(): Promise<void>;
    selectionChanged(): Promise<void>;
    private vibrateFor;
}
