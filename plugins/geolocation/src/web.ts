/**
 * @napacitor/geolocation 浏览器实现(基于 navigator.geolocation)。
 * watchPosition/clearWatch 由入口层直接走 navigator.geolocation,
 * 此处仅提供可经 core 分发的方法(getCurrentPosition / 权限)。
 */
import type { PermissionStatus, Position, PositionOptions } from './definitions';

export class GeolocationWeb {
  async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation.getCurrentPosition:浏览器不支持 Geolocation');
    }
    return new Promise<Position>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve(this._toPosition(p)),
        (err) => reject(new Error(err.message)),
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? false,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 0,
        },
      );
    });
  }

  async checkPermissions(): Promise<PermissionStatus> {
    // 浏览器无同步权限查询(Napacitor 0.1 不接 navigator.permissions),统一返回 prompt
    return { location: 'prompt', coarseLocation: 'prompt' };
  }

  async requestPermissions(): Promise<PermissionStatus> {
    throw new Error(
      'Geolocation.requestPermissions:web 平台不支持(浏览器在取位置时自行触发授权)');
  }

  private _toPosition(p: GeolocationPosition): Position {
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
}
