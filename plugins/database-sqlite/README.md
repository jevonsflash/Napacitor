# @napacitor/database-sqlite

本地 SQLite 数据库插件:建表、增删改查、事务,以及数据库文件的检查与删除。

## 安装方式

To use npm:

```bash
npm install @napacitor/database-sqlite
```

To use yarn:

```bash
yarn add @napacitor/database-sqlite
```

Sync native files:

```bash
npx nap sync
```

## 用法

```ts
import { DatabaseSqlite } from '@napacitor/database-sqlite';

// 建表(多条语句可用分号分隔顺序执行)
await DatabaseSqlite.execute({
  statements:
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);',
});

// 插入(占位符 ? 或 $1、$2 与 values 一一对应,防 SQL 注入)
const { lastId } = await DatabaseSqlite.run({
  statement: 'INSERT INTO users (name) VALUES (?);',
  values: ['Max'],
});

// 查询:每行以「列名 → 值」对象返回
const result = await DatabaseSqlite.query({
  statement: 'SELECT * FROM users WHERE name = ?;',
  values: ['Max'],
});
console.log(result.values); // [{ id: 1, name: 'Max' }]

// 批量写入包在事务里(失败整体回滚)
await DatabaseSqlite.execute({
  statements: "INSERT INTO users (name) VALUES ('A'); INSERT INTO users (name) VALUES ('B');",
  transaction: true,
});

// 数据库文件管理
const { exists } = await DatabaseSqlite.isDatabaseExists({ database: 'users.db3' });
const list = await DatabaseSqlite.getDatabaseList(); // { values: ['napacitor.db3', ...] }
await DatabaseSqlite.deleteDatabase({ database: 'users.db3' });

// 连接管理(连接按库名缓存复用,一般无需手动调用)
await DatabaseSqlite.close({ database: 'users.db3' });
await DatabaseSqlite.closeAll();
```

## 实现原理

封装 .NET MAUI 文档「[本地数据库](https://learn.microsoft.com/zh-cn/dotnet/maui/data-cloud/database-sqlite)」所述的 SQLite 方案,C# 侧基于 [Microsoft.Data.Sqlite](https://learn.microsoft.com/zh-cn/dotnet/standard/data/sqlite) 实现,一套代码同时覆盖 Android、iOS、Mac Catalyst 和 Windows:

- 数据库文件一律存放在应用数据目录(`FileSystem.AppDataDirectory`)下;
- 连接按数据库名缓存复用;所有 SQL 操作串行执行(SQLite 连接非线程安全);
- `execute()` → 一条或多条语句(分号分隔,顺序执行),可选事务;
- `run()` → 单条带参数语句,返回受影响行数 `changes` 与最近插入的 `lastId`;
- `query()` → 带参数查询,返回全部结果行(INTEGER → number,TEXT → string,BLOB → base64 字符串);
- 值类型映射:number → INTEGER/REAL,string → TEXT,boolean → 1/0,null → NULL;
- 数据库名仅允许纯文件名(防路径穿越),未指定时使用默认库 `napacitor.db3`。

若应用同时在 C# 侧使用 `sqlite-net-pcl`,两个包可以共存;两者各自注册自己的
SQLitePCLRaw provider(bundle_e_sqlite3 / bundle_green),运行时以最后注册的为准,一般无冲突。

## 平台说明

| 平台 | 说明 |
| --- | --- |
| Android / iOS / Mac Catalyst / Windows | 全部 API 可用(`Microsoft.Data.Sqlite` 的 SQLitePCLRaw 原生库随包自动引入) |
| Web | **不支持**。浏览器没有内置 SQLite,全部方法抛错;如需浏览器端 SQLite,请自行接入 sql.js 或 wa-sqlite 等 WASM 方案 |

## 权限

无需额外配置(SQLite 文件在应用数据目录内,不涉及系统权限)。

## API

### execute(options)

执行不返回结果集的一条或多条 SQL(建表、增删改、DDL 等)。语句按顺序执行;`transaction` 为 `true` 时整体提交,失败回滚。

| Param         | Type            |
| ------------- | --------------- |
| **`options`** | `ExecuteOptions` |

**Returns:** `Promise<ExecuteResult>`

### run(options)

执行单条带参数 SQL(增删改),返回受影响行数与最近插入的 rowid。

| Param         | Type        |
| ------------- | ----------- |
| **`options`** | `RunOptions` |

**Returns:** `Promise<RunResult>`

### query(options)

执行带参数查询,返回全部结果行。

| Param         | Type          |
| ------------- | ------------- |
| **`options`** | `QueryOptions` |

**Returns:** `Promise<QueryResult>`

### close(options?)

关闭数据库连接(再次使用时会重新打开)。

| Param         | Type           |
| ------------- | -------------- |
| **`options`** | `CloseOptions` |

**Returns:** `Promise<void>`

### closeAll()

关闭全部已打开的数据库连接。

**Returns:** `Promise<void>`

### deleteDatabase(options)

删除数据库文件(先关闭连接)。

| Param         | Type                    |
| ------------- | ----------------------- |
| **`options`** | `DeleteDatabaseOptions` |

**Returns:** `Promise<DeleteDatabaseResult>`

### isDatabaseExists(options)

检查数据库文件是否存在。

| Param         | Type                       |
| ------------- | -------------------------- |
| **`options`** | `IsDatabaseExistsOptions`  |

**Returns:** `Promise<IsDatabaseExistsResult>`

### getDatabaseList()

列出应用数据目录下已创建的 SQLite 数据库文件名。

**Returns:** `Promise<GetDatabaseListResult>`

## Interfaces

### ExecuteOptions

| Prop              | Type      | Description                                             |
| ----------------- | --------- | ------------------------------------------------------- |
| **`database`**    | `string`  | 数据库文件名;省略时使用默认库 `napacitor.db3`。           |
| **`statements`**  | `string`  | 一条或多条 SQL 语句(分号分隔,顺序执行;不支持参数绑定)。 |
| **`transaction`** | `boolean` | 多条语句时是否包在一个事务里(失败整体回滚)。             |

### ExecuteResult

| Prop          | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| **`changes`** | `number` | 受影响行数(多语句时为累计值)。      |

### RunOptions

| Prop              | Type        | Description                                                  |
| ----------------- | ----------- | ------------------------------------------------------------ |
| **`database`**    | `string`    | 数据库文件名;省略时使用默认库 `napacitor.db3`。                |
| **`statement`**   | `string`    | 单条 SQL 语句(带参数占位符)。                                 |
| **`values`**      | `unknown[]` | 与占位符一一对应的参数值(number/string/boolean/null)。        |
| **`transaction`** | `boolean`   | 是否包在事务里(失败回滚)。                                    |

### RunResult

| Prop          | Type     | Description                                                        |
| ------------- | -------- | ------------------------------------------------------------------ |
| **`changes`** | `number` | 受影响行数。                                                        |
| **`lastId`**  | `number` | 最近一次 INSERT 的自增 rowid(无插入操作时无意义,通常为 0)。        |

### QueryOptions

| Prop            | Type        | Description                                           |
| --------------- | ----------- | ----------------------------------------------------- |
| **`database`**  | `string`    | 数据库文件名;省略时使用默认库 `napacitor.db3`。        |
| **`statement`** | `string`    | 查询 SQL 语句(带参数占位符)。                          |
| **`values`**    | `unknown[]` | 与占位符一一对应的参数值(number/string/boolean/null)。 |

### QueryResult

| Prop         | Type                       | Description                                                                 |
| ------------ | -------------------------- | --------------------------------------------------------------------------- |
| **`values`** | `Record<string, unknown>[]` | 结果行数组;每行以「列名 → 值」对象表示(同名列后者覆盖前者)。                |

### CloseOptions

| Prop           | Type     | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| **`database`** | `string` | 要关闭连接的数据库文件名;省略时关闭默认库。   |

### DeleteDatabaseOptions

| Prop           | Type     | Description              |
| -------------- | -------- | ------------------------ |
| **`database`** | `string` | 要删除的数据库文件名。    |

### DeleteDatabaseResult

| Prop          | Type      | Description                                    |
| ------------- | --------- | ---------------------------------------------- |
| **`deleted`** | `boolean` | 是否真的删除了文件(数据库不存在时为 false)。    |

### IsDatabaseExistsOptions

| Prop           | Type     | Description                            |
| -------------- | -------- | -------------------------------------- |
| **`database`** | `string` | 要检查的数据库文件名;省略时检查默认库。 |

### IsDatabaseExistsResult

| Prop         | Type      | Description            |
| ------------ | --------- | ---------------------- |
| **`exists`** | `boolean` | 数据库文件是否存在。    |

### GetDatabaseListResult

| Prop         | Type       | Description                                       |
| ------------ | ---------- | ------------------------------------------------- |
| **`values`** | `string[]` | 应用数据目录下已创建的 SQLite 数据库文件名列表。   |
