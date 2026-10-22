/**
 * @napacitor/app-launcher 浏览器实现。
 */
import type {
  CanOpenAppResult,
  CanOpenUrlResult,
  OpenAppOptions,
  OpenMapOptions,
  OpenUrlOptions,
} from './definitions';

export class AppLauncherWeb {
  async openUrl(options: OpenUrlOptions): Promise<void> {
    window.open(options.url, '_blank', 'noopener');
  }

  async canOpenUrl(options: OpenUrlOptions): Promise<CanOpenUrlResult> {
    const proto = options.url.split(':')[0]?.toLowerCase();
    return { canOpen: proto === 'http' || proto === 'https' || proto === 'mailto' || proto === 'tel' };
  }

  async openApp(_options: OpenAppOptions): Promise<void> {
    throw new Error('AppLauncher.openApp:浏览器不支持通过包名打开应用');
  }

  async canOpenApp(_options: OpenAppOptions): Promise<CanOpenAppResult> {
    return { canOpen: false };
  }

  async openMap(options: OpenMapOptions): Promise<void> {
    const label = options.label ? `(${encodeURIComponent(options.label)})` : '';
    const url = `https://www.google.com/maps?q=${options.latitude},${options.longitude}${label}`;
    window.open(url, '_blank', 'noopener');
  }
}
