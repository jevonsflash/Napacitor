/**
 * @napacitor/local-notification 浏览器实现(基于 Notification API)。
 * 定时通知用 setTimeout 实现 —— 仅页面存活期间有效,
 * 与原生平台的 AlarmManager / UNCalendarNotificationTrigger 语义不同。
 */
import type { PluginListenerHandle } from '@napacitor/core';
import type {
  CancelOptions,
  NotificationReceived,
  NotificationReceivedCallback,
  PermissionStatus,
  ScheduleOptions,
  ScheduleResult,
  ScheduledNotification,
} from './definitions';

export class LocalNotificationWeb {
  private _nextId = 1;
  private _timers = new Map<number, number>();
  private _active = new Map<number, Notification>();
  private _listeners: NotificationReceivedCallback[] = [];

  async requestPermission(): Promise<PermissionStatus> {
    if (typeof Notification === 'undefined') {
      throw new Error('LocalNotification:此浏览器不支持 Notification API');
    }
    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted' };
  }

  async schedule(options: ScheduleOptions): Promise<ScheduleResult> {
    const notifications: ScheduledNotification[] = [];
    for (const item of options.notifications) {
      const id = item.id ?? this._nextId++;
      if (item.at) {
        const delay = Math.max(0, Date.parse(item.at) - Date.now());
        const timer = window.setTimeout(() => {
          this._timers.delete(id);
          this.show(id, item.title, item.body);
        }, delay);
        this._timers.set(id, timer);
      } else {
        this.show(id, item.title, item.body);
      }
      notifications.push({ id });
    }
    return { notifications };
  }

  async cancel(options: CancelOptions): Promise<void> {
    for (const item of options.notifications) {
      const timer = this._timers.get(item.id);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        this._timers.delete(item.id);
      }
      const active = this._active.get(item.id);
      if (active) {
        active.close();
        this._active.delete(item.id);
      }
    }
  }

  async addListener(
    eventName: 'notificationReceived',
    callback: NotificationReceivedCallback,
  ): Promise<PluginListenerHandle> {
    if (eventName !== 'notificationReceived') {
      throw new Error(`LocalNotification:不支持的事件名 ${eventName}`);
    }
    this._listeners.push(callback);
    return {
      remove: async () => {
        this._listeners = this._listeners.filter((c) => c !== callback);
      },
    };
  }

  async removeAllListeners(): Promise<void> {
    this._listeners = [];
  }

  private show(id: number, title: string, body: string): void {
    const notification = new Notification(title, {
      body,
      tag: String(id),
    });
    this._active.set(id, notification);
    notification.onclick = () => this.emit({ id, title, body });
  }

  private emit(payload: NotificationReceived): void {
    this._listeners.forEach((callback) => callback(payload));
  }
}
