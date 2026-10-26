/**
 * @napacitor/geolocation 入口。
 *
 * watchPosition 的适配说明:Capacitor 的回调式 watch 在 Napacitor 上映射为
 * "原生 watchPosition 方法 + position/error 事件管线"(与 Motion 插件同形)。
 * web 环境 core 的 addListener 未实现,故直接走 navigator.geolocation。
 */
import { Napacitor, registerPlugin } from '@napacitor/core';
import type {
  CallbackID,
  ClearWatchOptions,
  GeolocationPlugin,
  PermissionStatus,
  Position,
  PositionOptions,
  WatchPositionCallback,
} from './definitions';

/** 原生桥插件代理(方法名与 C# 侧一致;watchPosition 返回 {id})。 */
interface GeolocationImpl {
  getCurrentPosition(options?: PositionOptions): Promise<Position>;
  watchPosition(options?: PositionOptions): Promise<{ id: string }>;
  clearWatch(options: ClearWatchOptions): Promise<void>;
  checkPermissions(): Promise<PermissionStatus>;
  requestPermissions(): Promise<PermissionStatus>;
  addListener(
    eventName: 'position' | 'error',
    listener: (data: unknown) => void,
  ): Promise<{ remove: () => Promise<void> }>;
  removeListener(eventName: 'position' | 'error'): Promise<void>;
}

const impl = registerPlugin<GeolocationImpl>('Geolocation', {
  web: () => import('./web').then((m) => new m.GeolocationWeb()),
});

/** web 前缀的 watch id(navigator.geolocation 的原生 id)。 */
const WEB_WATCH_PREFIX = 'web.';

export const Geolocation: GeolocationPlugin = {
  getCurrentPosition: (options?) => impl.getCurrentPosition(options ?? {}),

  checkPermissions: () => impl.checkPermissions(),

  requestPermissions: () => impl.requestPermissions(),

  watchPosition: async (
    options: PositionOptions,
    callback: WatchPositionCallback,
  ): Promise<CallbackID> => {
    if (!Napacitor.isNativePlatform()) {
      return webWatch(options ?? {}, callback);
    }
    // 先挂事件再启动原生监听,避免首条位置丢失
    await impl.addListener('position', (pos) => callback(pos as Position));
    await impl.addListener('error', (err) => callback(null, err as { code: string; message: string }));
    const { id } = await impl.watchPosition(options ?? {});
    return id;
  },

  clearWatch: async (options: ClearWatchOptions): Promise<void> => {
    if (options.id.startsWith(WEB_WATCH_PREFIX)) {
      navigator.geolocation.clearWatch(Number(options.id.slice(WEB_WATCH_PREFIX.length)));
      return;
    }
    await impl.clearWatch(options);
    // 停止原生监听后移除本插件的事件监听(按事件名粒度移除)
    await impl.removeListener('position');
    await impl.removeListener('error');
  },
};

/** web 环境直接使用 navigator.geolocation。 */
function webWatch(
  options: PositionOptions,
  callback: WatchPositionCallback,
): CallbackID {
  if (!('geolocation' in navigator)) {
    callback(null, { code: 'UNAVAILABLE', message: '浏览器不支持 Geolocation' });
    return '';
  }
  const id = navigator.geolocation.watchPosition(
    (p) => callback(toPosition(p)),
    (err) => callback(null, { code: 'ERROR', message: err.message }),
    {
      enableHighAccuracy: options.enableHighAccuracy ?? false,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 0,
    },
  );
  return `${WEB_WATCH_PREFIX}${id}`;
}

/** GeolocationPosition → Position。 */
function toPosition(p: GeolocationPosition): Position {
  return {
    timestamp: p.timestamp,
    coords: {
      latitude: p.coords.latitude,
      longitude: p.coords.longitude,
      accuracy: p.coords.accuracy,
      altitude: p.coords.altitude ?? null,
      altitudeAccuracy: p.coords.altitudeAccuracy ?? null,
      heading: p.coords.heading ?? null,
      speed: p.coords.speed ?? null,
    },
  };
}

export * from './definitions';
