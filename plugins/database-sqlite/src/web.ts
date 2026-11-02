/**
 * @napacitor/database-sqlite 浏览器实现。
 *
 * 浏览器没有内置 SQLite,本插件无法在纯 Web 环境提供数据库能力:
 * 全部方法以错误形式拒绝,提示只在 Napacitor 原生宿主中可用
 * (与 Capacitor 生态中 SQLite 插件在 Web 端需 sql.js 等 WASM 方案对应;
 * 如需浏览器端 SQLite,请自行接入 sql.js 或 wa-sqlite)。
 */
import type {
  CloseOptions,
  DatabaseSqlitePlugin,
  DeleteDatabaseOptions,
  DeleteDatabaseResult,
  ExecuteOptions,
  ExecuteResult,
  GetDatabaseListResult,
  IsDatabaseExistsOptions,
  IsDatabaseExistsResult,
  QueryOptions,
  QueryResult,
  RunOptions,
  RunResult,
} from './definitions';

const webUnsupported = (method: string): Promise<never> =>
  Promise.reject(
    new Error(
      `DatabaseSqlite:浏览器端不支持 ${method}()。浏览器没有内置 SQLite,` +
        '本插件仅在 Napacitor 原生宿主(Android/iOS/Mac Catalyst/Windows)中可用;' +
        '如需浏览器端 SQLite,请自行接入 sql.js 或 wa-sqlite 等 WASM 方案。',
    ),
  );

export class DatabaseSqliteWeb implements DatabaseSqlitePlugin {
  execute(options: ExecuteOptions): Promise<ExecuteResult> {
    void options;
    return webUnsupported('execute');
  }

  run(options: RunOptions): Promise<RunResult> {
    void options;
    return webUnsupported('run');
  }

  query(options: QueryOptions): Promise<QueryResult> {
    void options;
    return webUnsupported('query');
  }

  close(options?: CloseOptions): Promise<void> {
    void options;
    return webUnsupported('close');
  }

  closeAll(): Promise<void> {
    return webUnsupported('closeAll');
  }

  deleteDatabase(options: DeleteDatabaseOptions): Promise<DeleteDatabaseResult> {
    void options;
    return webUnsupported('deleteDatabase');
  }

  isDatabaseExists(
    options: IsDatabaseExistsOptions,
  ): Promise<IsDatabaseExistsResult> {
    void options;
    return webUnsupported('isDatabaseExists');
  }

  getDatabaseList(): Promise<GetDatabaseListResult> {
    return webUnsupported('getDatabaseList');
  }
}
