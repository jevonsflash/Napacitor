/**
 * @napacitor/database-sqlite 类型定义。
 * 封装本地 SQLite 数据库(C# 侧基于 Microsoft.Data.Sqlite,
 * 对应 .NET MAUI 文档「本地数据库」所述的 SQLite 方案)。
 */

/**
 * 执行不返回结果集的一条或多条 SQL(建表、增删改、DDL 等)。
 */
export interface ExecuteOptions {
  /** 数据库文件名(位于应用数据目录);省略时使用默认库 'napacitor.db3'。 */
  database?: string;
  /** 一条或多条 SQL 语句(分号分隔,顺序执行;不支持参数绑定)。 */
  statements: string;
  /** 多条语句时是否包在一个事务里(失败整体回滚)。 */
  transaction?: boolean;
}

/** execute() 返回值。 */
export interface ExecuteResult {
  /** 受影响行数(多语句时为累计值)。 */
  changes: number;
}

/**
 * 执行单条带参数 SQL(增删改);占位符用 `?` 或 `$1`、`$2` 与 values 对应。
 */
export interface RunOptions {
  /** 数据库文件名(位于应用数据目录);省略时使用默认库 'napacitor.db3'。 */
  database?: string;
  /** 单条 SQL 语句(带参数占位符)。 */
  statement: string;
  /** 与占位符一一对应的参数值(number/string/boolean/null)。 */
  values?: unknown[];
  /** 是否包在事务里(失败回滚)。 */
  transaction?: boolean;
}

/** run() 返回值。 */
export interface RunResult {
  /** 受影响行数。 */
  changes: number;
  /** 最近一次 INSERT 的自增 rowid(无插入操作时无意义,通常为 0)。 */
  lastId: number;
}

/**
 * 执行查询;占位符用 `?` 或 `$1`、`$2` 与 values 对应。
 */
export interface QueryOptions {
  /** 数据库文件名(位于应用数据目录);省略时使用默认库 'napacitor.db3'。 */
  database?: string;
  /** 查询 SQL 语句(带参数占位符)。 */
  statement: string;
  /** 与占位符一一对应的参数值(number/string/boolean/null)。 */
  values?: unknown[];
}

/** query() 返回值。 */
export interface QueryResult {
  /**
   * 结果行数组;每行以「列名 → 值」对象表示
   * (INTEGER → number,TEXT → string,BLOB → base64 字符串;同名列后者覆盖前者)。
   */
  values: Record<string, unknown>[];
}

/** close() 参数。 */
export interface CloseOptions {
  /** 要关闭连接的数据库文件名;省略时关闭默认库。 */
  database?: string;
}

/** deleteDatabase() 参数。 */
export interface DeleteDatabaseOptions {
  /** 要删除的数据库文件名。 */
  database?: string;
}

/** deleteDatabase() 返回值。 */
export interface DeleteDatabaseResult {
  /** 是否真的删除了文件(数据库不存在时为 false)。 */
  deleted: boolean;
}

/** isDatabaseExists() 参数。 */
export interface IsDatabaseExistsOptions {
  /** 要检查的数据库文件名;省略时检查默认库。 */
  database?: string;
}

/** isDatabaseExists() 返回值。 */
export interface IsDatabaseExistsResult {
  /** 数据库文件是否存在。 */
  exists: boolean;
}

/** getDatabaseList() 返回值。 */
export interface GetDatabaseListResult {
  /** 应用数据目录下已创建的 SQLite 数据库文件名列表。 */
  values: string[];
}

export interface DatabaseSqlitePlugin {
  /**
   * 执行不返回结果集的一条或多条 SQL(建表、增删改、DDL 等)。
   * 语句按顺序执行;transaction 为 true 时整体提交,失败回滚。
   */
  execute(options: ExecuteOptions): Promise<ExecuteResult>;
  /** 执行单条带参数 SQL(增删改),返回受影响行数与最近插入的 rowid。 */
  run(options: RunOptions): Promise<RunResult>;
  /** 执行带参数查询,返回全部结果行。 */
  query(options: QueryOptions): Promise<QueryResult>;
  /** 关闭数据库连接(再次使用时会重新打开)。 */
  close(options?: CloseOptions): Promise<void>;
  /** 关闭全部已打开的数据库连接。 */
  closeAll(): Promise<void>;
  /** 删除数据库文件(先关闭连接)。 */
  deleteDatabase(options: DeleteDatabaseOptions): Promise<DeleteDatabaseResult>;
  /** 检查数据库文件是否存在。 */
  isDatabaseExists(
    options: IsDatabaseExistsOptions,
  ): Promise<IsDatabaseExistsResult>;
  /** 列出应用数据目录下已创建的 SQLite 数据库文件名。 */
  getDatabaseList(): Promise<GetDatabaseListResult>;
}
