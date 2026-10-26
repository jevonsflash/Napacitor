namespace Napacitor.Plugins.Preferences;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>configure() 参数。</summary>
public class PreferencesConfigureOptions
{
    /// <summary>存储组名(映射 MAUI Preferences 的 sharedName)。</summary>
    public string? Group { get; set; }
}

/// <summary>get() 参数。</summary>
public class PreferencesGetOptions
{
    public string? Key { get; set; }
}

/// <summary>get() 返回值。</summary>
public class PreferencesGetResult
{
    public string? Value { get; set; }
}

/// <summary>set() 参数。</summary>
public class PreferencesSetOptions
{
    public string? Key { get; set; }
    public string? Value { get; set; }
}

/// <summary>remove() 参数。</summary>
public class PreferencesRemoveOptions
{
    public string? Key { get; set; }
}

/// <summary>migrate() 返回值。</summary>
public class PreferencesMigrateResult
{
    public List<string> Migrated { get; set; } = new();
    public List<string> Existing { get; set; } = new();
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Preferences 插件:键值持久化存储(封装 MAUI Preferences API)。
///
/// 架构差异说明:MAUI Preferences 不提供键枚举能力,故本插件不提供 keys()。
/// </summary>
[NapacitorPlugin("Preferences")]
public class PreferencesPlugin : NapacitorPluginBase
{
    private string? _group;

    /// <summary>运行时配置存储组(作用于后续全部读写清除)。</summary>
    [NapacitorMethod]
    public Task Configure(PreferencesConfigureOptions options)
    {
        _group = string.IsNullOrEmpty(options.Group) ? null : options.Group;
        return Task.CompletedTask;
    }

    /// <summary>读取键值。</summary>
    [NapacitorMethod]
    public Task<PreferencesGetResult> Get(PreferencesGetOptions options)
    {
        var key = RequireKey(options.Key);
        return Task.FromResult(new PreferencesGetResult
        {
            Value = Microsoft.Maui.Storage.Preferences.Default.Get(key, (string?)null, _group),
        });
    }

    /// <summary>写入键值。</summary>
    [NapacitorMethod]
    public Task Set(PreferencesSetOptions options)
    {
        var key = RequireKey(options.Key);
        Microsoft.Maui.Storage.Preferences.Default.Set(key, options.Value ?? string.Empty, _group);
        return Task.CompletedTask;
    }

    /// <summary>删除指定键。</summary>
    [NapacitorMethod]
    public Task Remove(PreferencesRemoveOptions options)
    {
        var key = RequireKey(options.Key);
        Microsoft.Maui.Storage.Preferences.Default.Remove(key, _group);
        return Task.CompletedTask;
    }

    /// <summary>清空当前存储组。</summary>
    [NapacitorMethod]
    public Task Clear()
    {
        Microsoft.Maui.Storage.Preferences.Default.Clear(_group);
        return Task.CompletedTask;
    }

    /// <summary>从 Capacitor 2 Storage 迁移(Napacitor 无迁移源,恒返回空结果)。</summary>
    [NapacitorMethod]
    public Task<PreferencesMigrateResult> Migrate()
    {
        return Task.FromResult(new PreferencesMigrateResult());
    }

    /// <summary>删除 Capacitor 2 Storage 旧数据(no-op)。</summary>
    [NapacitorMethod]
    public Task RemoveOld()
    {
        return Task.CompletedTask;
    }

    /* ── 参数校验 ── */

    private static string RequireKey(string? key)
    {
        if (string.IsNullOrEmpty(key))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "Preferences:key 不能为空");
        }
        return key;
    }
}
