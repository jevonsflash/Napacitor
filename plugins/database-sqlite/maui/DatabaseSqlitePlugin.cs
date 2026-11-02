using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace Napacitor.Plugins.DatabaseSqlite;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>execute() 参数。</summary>
public class DatabaseSqliteExecuteOptions
{
    /// <summary>数据库文件名;省略时使用默认库 'napacitor.db3'。</summary>
    public string? Database { get; set; }

    /// <summary>一条或多条 SQL 语句(分号分隔,顺序执行;不支持参数绑定)。</summary>
    public string? Statements { get; set; }

    /// <summary>多条语句时是否包在一个事务里(失败整体回滚)。</summary>
    public bool Transaction { get; set; }
}

/// <summary>execute() 返回值。</summary>
public class DatabaseSqliteExecuteResult
{
    /// <summary>受影响行数(多语句时为累计值)。</summary>
    public int Changes { get; set; }
}

/// <summary>run() 参数。</summary>
public class DatabaseSqliteRunOptions
{
    /// <summary>数据库文件名;省略时使用默认库 'napacitor.db3'。</summary>
    public string? Database { get; set; }

    /// <summary>单条 SQL 语句(带参数占位符 ? 或 $1、$2)。</summary>
    public string? Statement { get; set; }

    /// <summary>与占位符一一对应的参数值。</summary>
    public List<JsonElement>? Values { get; set; }

    /// <summary>是否包在事务里(失败回滚)。</summary>
    public bool Transaction { get; set; }
}

/// <summary>run() 返回值。</summary>
public class DatabaseSqliteRunResult
{
    /// <summary>受影响行数。</summary>
    public int Changes { get; set; }

    /// <summary>最近一次 INSERT 的自增 rowid(无插入操作时无意义,通常为 0)。</summary>
    public long LastId { get; set; }
}

/// <summary>query() 参数。</summary>
public class DatabaseSqliteQueryOptions
{
    /// <summary>数据库文件名;省略时使用默认库 'napacitor.db3'。</summary>
    public string? Database { get; set; }

    /// <summary>查询 SQL 语句(带参数占位符 ? 或 $1、$2)。</summary>
    public string? Statement { get; set; }

    /// <summary>与占位符一一对应的参数值。</summary>
    public List<JsonElement>? Values { get; set; }
}

/// <summary>query() 返回值。</summary>
public class DatabaseSqliteQueryResult
{
    /// <summary>结果行数组:每行以「列名 → 值」对象表示(同名列后者覆盖前者)。</summary>
    public List<Dictionary<string, object?>> Values { get; set; } = new();
}

/// <summary>close() 参数。</summary>
public class DatabaseSqliteCloseOptions
{
    /// <summary>要关闭连接的数据库文件名;省略时关闭默认库。</summary>
    public string? Database { get; set; }
}

/// <summary>deleteDatabase() 参数。</summary>
public class DatabaseSqliteDeleteDatabaseOptions
{
    /// <summary>要删除的数据库文件名。</summary>
    public string? Database { get; set; }
}

/// <summary>deleteDatabase() 返回值。</summary>
public class DatabaseSqliteDeleteDatabaseResult
{
    /// <summary>是否真的删除了文件(数据库不存在时为 false)。</summary>
    public bool Deleted { get; set; }
}

/// <summary>isDatabaseExists() 参数。</summary>
public class DatabaseSqliteIsDatabaseExistsOptions
{
    /// <summary>要检查的数据库文件名;省略时检查默认库。</summary>
    public string? Database { get; set; }
}

/// <summary>isDatabaseExists() 返回值。</summary>
public class DatabaseSqliteIsDatabaseExistsResult
{
    /// <summary>数据库文件是否存在。</summary>
    public bool Exists { get; set; }
}

/// <summary>getDatabaseList() 返回值。</summary>
public class DatabaseSqliteGetDatabaseListResult
{
    /// <summary>应用数据目录下已创建的 SQLite 数据库文件名列表。</summary>
    public List<string> Values { get; set; } = new();
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// DatabaseSqlite 插件:本地 SQLite 数据库(封装 Microsoft.Data.Sqlite,
/// 对应 .NET MAUI 文档「本地数据库」所述的 SQLite 方案)。
///
/// 架构说明:数据库文件一律位于 <see cref="Microsoft.Maui.Storage.FileSystem.AppDataDirectory"/>;
/// 连接按数据库名缓存复用;所有 SQL 操作经信号量串行化
/// (SQLite 连接非线程安全,且串行执行天然避免锁竞争)。
/// </summary>
[NapacitorPlugin("DatabaseSqlite")]
public class DatabaseSqlitePlugin : NapacitorPluginBase
{
    /// <summary>未指定 database 时使用的默认库文件名。</summary>
    public const string DefaultDatabase = "napacitor.db3";

    private static readonly string[] SqliteExtensions =
    {
        ".db", ".db3", ".sqlite", ".sqlite3", ".s3db",
    };

    private readonly ConcurrentDictionary<string, SqliteConnection> _connections =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly SemaphoreSlim _gate = new(1, 1);

    /// <summary>执行不返回结果集的一条或多条 SQL(建表、增删改、DDL 等)。</summary>
    [NapacitorMethod]
    public async Task<DatabaseSqliteExecuteResult> Execute(DatabaseSqliteExecuteOptions options)
    {
        var sql = RequireSql(options.Statements);
        var database = NormalizeName(options.Database);

        await _gate.WaitAsync().ConfigureAwait(false);
        try
        {
            var connection = GetConnection(database);
            var changes = await ExecuteCoreAsync(connection, sql, null, options.Transaction)
                .ConfigureAwait(false);
            return new DatabaseSqliteExecuteResult { Changes = changes };
        }
        catch (NapacitorException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw SqliteError(ex);
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>执行单条带参数 SQL(增删改),返回受影响行数与最近插入的 rowid。</summary>
    [NapacitorMethod]
    public async Task<DatabaseSqliteRunResult> Run(DatabaseSqliteRunOptions options)
    {
        var sql = RequireSql(options.Statement);
        var database = NormalizeName(options.Database);

        await _gate.WaitAsync().ConfigureAwait(false);
        try
        {
            var connection = GetConnection(database);
            var changes = await ExecuteCoreAsync(connection, sql, options.Values, options.Transaction)
                .ConfigureAwait(false);

            long lastId = 0;
            using (var command = connection.CreateCommand())
            {
                command.CommandText = "SELECT last_insert_rowid();";
                lastId = (long)(await command.ExecuteScalarAsync().ConfigureAwait(false))!;
            }

            return new DatabaseSqliteRunResult { Changes = changes, LastId = lastId };
        }
        catch (NapacitorException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw SqliteError(ex);
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>执行带参数查询,返回全部结果行。</summary>
    [NapacitorMethod]
    public async Task<DatabaseSqliteQueryResult> Query(DatabaseSqliteQueryOptions options)
    {
        var sql = RequireSql(options.Statement);
        var database = NormalizeName(options.Database);

        await _gate.WaitAsync().ConfigureAwait(false);
        try
        {
            var connection = GetConnection(database);
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            BindValues(command, options.Values);

            var rows = new List<Dictionary<string, object?>>();
            await using (var reader = await command.ExecuteReaderAsync().ConfigureAwait(false))
            {
                while (await reader.ReadAsync().ConfigureAwait(false))
                {
                    var row = new Dictionary<string, object?>(reader.FieldCount);
                    for (var i = 0; i < reader.FieldCount; i++)
                    {
                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    }

                    rows.Add(row);
                }
            }

            return new DatabaseSqliteQueryResult { Values = rows };
        }
        catch (NapacitorException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw SqliteError(ex);
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>关闭数据库连接(再次使用时会重新打开)。</summary>
    [NapacitorMethod]
    public Task Close(DatabaseSqliteCloseOptions? options)
    {
        var database = NormalizeName(options?.Database);
        if (_connections.TryRemove(database, out var connection))
        {
            connection.Dispose();
        }

        return Task.CompletedTask;
    }

    /// <summary>关闭全部已打开的数据库连接。</summary>
    [NapacitorMethod]
    public Task CloseAll()
    {
        foreach (var connection in _connections.Values)
        {
            connection.Dispose();
        }

        _connections.Clear();
        return Task.CompletedTask;
    }

    /// <summary>删除数据库文件(先关闭连接)。</summary>
    [NapacitorMethod]
    public Task<DatabaseSqliteDeleteDatabaseResult> DeleteDatabase(
        DatabaseSqliteDeleteDatabaseOptions options)
    {
        var database = NormalizeName(options.Database);
        if (_connections.TryRemove(database, out var connection))
        {
            connection.Dispose();
        }

        var path = ResolvePath(database);
        if (!File.Exists(path))
        {
            return Task.FromResult(new DatabaseSqliteDeleteDatabaseResult { Deleted = false });
        }

        File.Delete(path);
        return Task.FromResult(new DatabaseSqliteDeleteDatabaseResult { Deleted = true });
    }

    /// <summary>检查数据库文件是否存在。</summary>
    [NapacitorMethod]
    public Task<DatabaseSqliteIsDatabaseExistsResult> IsDatabaseExists(
        DatabaseSqliteIsDatabaseExistsOptions options)
    {
        var database = NormalizeName(options.Database);
        return Task.FromResult(new DatabaseSqliteIsDatabaseExistsResult
        {
            Exists = File.Exists(ResolvePath(database)),
        });
    }

    /// <summary>列出应用数据目录下已创建的 SQLite 数据库文件名。</summary>
    [NapacitorMethod]
    public Task<DatabaseSqliteGetDatabaseListResult> GetDatabaseList()
    {
        var result = new DatabaseSqliteGetDatabaseListResult();
        var directory = Microsoft.Maui.Storage.FileSystem.AppDataDirectory;
        if (Directory.Exists(directory))
        {
            foreach (var path in Directory.EnumerateFiles(directory))
            {
                var extension = Path.GetExtension(path);
                if (SqliteExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    result.Values.Add(Path.GetFileName(path));
                }
            }
        }

        return Task.FromResult(result);
    }

    /* ── SQL 执行核心 ── */

    /// <summary>执行单条/批量 SQL,可选事务;异常时回滚后原样上抛。</summary>
    private static async Task<int> ExecuteCoreAsync(
        SqliteConnection connection,
        string sql,
        List<JsonElement>? values,
        bool useTransaction)
    {
        SqliteTransaction? transaction = null;
        try
        {
            if (useTransaction)
            {
                transaction = connection.BeginTransaction();
            }

            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = sql;
            BindValues(command, values);
            var changes = await command.ExecuteNonQueryAsync().ConfigureAwait(false);
            transaction?.Commit();
            return changes;
        }
        catch
        {
            // 回滚失败不能掩盖原始异常
            try
            {
                transaction?.Rollback();
            }
            catch
            {
                // 忽略:保留原始异常
            }

            throw;
        }
    }

    /* ── 参数绑定 ── */

    /// <summary>
    /// 把 values 按顺序绑定为 $1、$2 … 参数(SQL 中用 ? 或 $n 占位均可)。
    /// </summary>
    private static void BindValues(SqliteCommand command, List<JsonElement>? values)
    {
        if (values is null)
        {
            return;
        }

        for (var i = 0; i < values.Count; i++)
        {
            command.Parameters.AddWithValue($"${i + 1}", ToSqlValue(values[i]));
        }
    }

    /// <summary>JSON 值 → SQLite 绑定值(SQLite 无布尔类型,true/false 存为 1/0)。</summary>
    private static object? ToSqlValue(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.String => element.GetString(),
        JsonValueKind.Number => element.TryGetInt64(out var integer)
            ? integer
            : element.GetDouble(),
        JsonValueKind.True => 1L,
        JsonValueKind.False => 0L,
        JsonValueKind.Null or JsonValueKind.Undefined => null,
        _ => element.GetRawText(),
    };

    /* ── 路径与校验 ── */

    /// <summary>规范化数据库名:缺省 → 默认库;仅允许纯文件名(防路径穿越)。</summary>
    private static string NormalizeName(string? database)
    {
        var name = string.IsNullOrWhiteSpace(database) ? DefaultDatabase : database.Trim();
        if (name.Contains("..") ||
            !string.Equals(Path.GetFileName(name), name, StringComparison.Ordinal))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"DatabaseSqlite:非法的数据库文件名 '{name}'(仅允许纯文件名,不含路径)");
        }

        return name;
    }

    /// <summary>数据库文件绝对路径(应用数据目录 + 文件名)。</summary>
    private static string ResolvePath(string database) =>
        Path.Combine(Microsoft.Maui.Storage.FileSystem.AppDataDirectory, database);

    /// <summary>按名取连接缓存,不存在则新建并打开。</summary>
    private SqliteConnection GetConnection(string database)
    {
        if (_connections.TryGetValue(database, out var existing))
        {
            return existing;
        }

        var connection = new SqliteConnection($"Data Source={ResolvePath(database)}");
        connection.Open();
        _connections.TryAdd(database, connection);
        return connection;
    }

    private static string RequireSql(string? sql)
    {
        if (string.IsNullOrWhiteSpace(sql))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "DatabaseSqlite:SQL 语句不能为空");
        }

        return sql;
    }

    private static NapacitorException SqliteError(Exception ex) =>
        new(
            NapacitorException.Error,
            $"DatabaseSqlite:SQL 执行失败:{ex.Message}");
}
