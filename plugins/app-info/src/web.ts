/**
 * @napacitor/app-info 浏览器实现。
 */
import type { AppInfoData, VersionTrackingData } from './definitions';

export class AppInfoWeb {
  async getInfo(): Promise<AppInfoData> {
    return {
      name: 'Web App',
      id: window.location.origin,
      version: '1.0.0',
      build: '1',
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      requestedLayoutOrientation: 'unspecified',
    };
  }

  async getVersionTracking(): Promise<VersionTrackingData> {
    const key = 'napacitor_appinfo_vt';
    const stored = localStorage.getItem(key);
    const data: VersionTrackingData = stored
      ? JSON.parse(stored)
      : {
          currentVersion: '1.0.0',
          currentBuild: '1',
          isFirstLaunchEver: true,
          isFirstLaunchForCurrentVersion: true,
          isFirstLaunchForCurrentBuild: true,
          previousVersion: '',
          previousBuild: '',
          versionHistory: ['1.0.0'],
          buildHistory: ['1'],
        };
    if (data.isFirstLaunchEver) {
      data.isFirstLaunchEver = false;
      localStorage.setItem(key, JSON.stringify(data));
    }
    return data;
  }

  async showSettingsUI(): Promise<void> {
    // 浏览器无应用设置 UI
  }

  async openSettings(): Promise<void> {
    throw new Error('AppInfo.openSettings:浏览器不支持打开应用设置');
  }
}
