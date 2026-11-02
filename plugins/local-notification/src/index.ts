/**
 * @napacitor/local-notification 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { LocalNotificationPlugin } from './definitions';

const LocalNotification = registerPlugin<LocalNotificationPlugin>(
  'LocalNotification',
  {
    web: () => import('./web').then((m) => new m.LocalNotificationWeb()),
  },
);

export * from './definitions';
export { LocalNotification };
