/**
 * @napacitor/connectivity 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { ConnectivityPlugin } from './definitions';

const Connectivity = registerPlugin<ConnectivityPlugin>('Connectivity', {
  web: () => import('./web').then((m) => new m.ConnectivityWeb()),
});

export * from './definitions';
export { Connectivity };
