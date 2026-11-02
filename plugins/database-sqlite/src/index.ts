/**
 * @napacitor/database-sqlite 入口。
 */
import { registerPlugin } from '@napacitor/core';
import type { DatabaseSqlitePlugin } from './definitions';

const DatabaseSqlite = registerPlugin<DatabaseSqlitePlugin>('DatabaseSqlite', {
  web: () => import('./web').then((m) => new m.DatabaseSqliteWeb()),
});

export * from './definitions';
export { DatabaseSqlite };
