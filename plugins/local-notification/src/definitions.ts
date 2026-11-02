/**
 * @napacitor/local-notification 类型定义。
 * 本地通知:立即或定时发送系统通知,支持权限请求、取消与点击回调。
 * (iOS / Mac Catalyst:UNUserNotificationCenter;Android:NotificationManager
 * + AlarmManager;Windows:AppNotificationManager;Web:Notification API)
 */
import type { PluginListenerHandle } from '@napacitor/core';

/** 单条本地通知定义。 */
export interface LocalNotificationSchema {
  /** 通知标题。 */
  title: string;
  /** 通知正文。 */
  body: string;
  /** 通知唯一 id(用于取消与点击回调);省略时由平台自动生成。 */
  id?: number;
  /** 计划发送时间(ISO 8601 字符串);省略时立即发送。 */
  at?: string;
}

/** schedule() 参数。 */
export interface ScheduleOptions {
  /** 要发送的通知数组。 */
  notifications: LocalNotificationSchema[];
}

/** 已排期的单条通知。 */
export interface ScheduledNotification {
  /** 通知 id(自动生成时为分配值)。 */
  id: number;
}

/** schedule() 返回值。 */
export interface ScheduleResult {
  notifications: ScheduledNotification[];
}

/** 要取消的单条通知。 */
export interface CancelNotificationSchema {
  /** 要取消的通知 id。 */
  id: number;
}

/** cancel() 参数。 */
export interface CancelOptions {
  /** 要取消的通知数组。 */
  notifications: CancelNotificationSchema[];
}

/** requestPermission() 返回值。 */
export interface PermissionStatus {
  /** 是否已获得通知权限。 */
  granted: boolean;
}

/** notificationReceived 事件的载荷。 */
export interface NotificationReceived {
  /** 通知 id(平台无法提供时为 0)。 */
  id: number;
  /** 通知标题。 */
  title: string;
  /** 通知正文。 */
  body: string;
}

/** notificationReceived 回调。 */
export type NotificationReceivedCallback = (
  payload: NotificationReceived,
) => void;

export interface LocalNotificationPlugin {
  /** 请求发送本地通知的权限(部分平台为 no-op,见各平台说明)。 */
  requestPermission(): Promise<PermissionStatus>;
  /** 立即或定时发送本地通知,返回每条通知的最终 id。 */
  schedule(options: ScheduleOptions): Promise<ScheduleResult>;
  /** 取消已排期/已展示的通知。 */
  cancel(options: CancelOptions): Promise<void>;
  /** 监听用户点击通知(应用被唤起或已在前台时触发)。 */
  addListener(
    eventName: 'notificationReceived',
    callback: NotificationReceivedCallback,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  /** 移除该插件全部监听器。 */
  removeAllListeners(): Promise<void>;
}
