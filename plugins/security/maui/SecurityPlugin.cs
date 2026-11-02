namespace Napacitor.Plugins.Security;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>get() 参数。</summary>
public class SecurityGetOptions
{
    public string? Key { get; set; }
}

/// <summary>get() 返回值。</summary>
public class SecurityGetResult
{
    public string? Value { get; set; }
}

/// <summary>set() 参数。</summary>
public class SecuritySetOptions
{
    public string? Key { get; set; }
    public string? Value { get; set; }
}

/// <summary>remove() 参数。</summary>
public class SecurityRemoveOptions
{
    public string? Key { get; set; }
}

/// <summary>remove() 返回值。</summary>
public class SecurityRemoveResult
{
    public bool Success { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Security 插件:安全键值存储(封装 MAUI SecureStorage API)。
///
/// 平台实现:iOS/Mac Catalyst 为 Keychain,Android 为
/// EncryptedSharedPreferences(密钥存于 Android Keystore),
/// Windows 为 DataProtectionProvider。
///
/// 架构差异说明:GetAsync / SetAsync 可能因设备不支持安全存储、
/// 加密密钥变更或数据损坏而抛异常(见 MS 文档「使用安全存储」提示),
/// 本插件将其转为带 ERROR 码的错误信封,应用侧可捕获后调用 clear()
/// 重建存储。
/// </summary>
[NapacitorPlugin("Security")]
public class SecurityPlugin : NapacitorPluginBase
{
    /// <summary>读取键值(未设置过或已删除时为 null)。</summary>
    [NapacitorMethod]
    public async Task<SecurityGetResult> Get(SecurityGetOptions options)
    {
        var key = RequireKey(options.Key);
        try
        {
            return new SecurityGetResult
            {
                Value = await Microsoft.Maui.Storage.SecureStorage.Default
                    .GetAsync(key)
                    .ConfigureAwait(false),
            };
        }
        catch (Exception ex)
        {
            throw StorageException("读取", ex);
        }
    }

    /// <summary>写入键值。</summary>
    [NapacitorMethod]
    public async Task Set(SecuritySetOptions options)
    {
        var key = RequireKey(options.Key);
        try
        {
            await Microsoft.Maui.Storage.SecureStorage.Default
                .SetAsync(key, options.Value ?? string.Empty)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            throw StorageException("写入", ex);
        }
    }

    /// <summary>删除指定键(返回键是否存在并被删除)。</summary>
    [NapacitorMethod]
    public Task<SecurityRemoveResult> Remove(SecurityRemoveOptions options)
    {
        var key = RequireKey(options.Key);
        return Task.FromResult(new SecurityRemoveResult
        {
            Success = Microsoft.Maui.Storage.SecureStorage.Default.Remove(key),
        });
    }

    /// <summary>清空全部安全存储值。</summary>
    [NapacitorMethod]
    public Task Clear()
    {
        Microsoft.Maui.Storage.SecureStorage.Default.RemoveAll();
        return Task.CompletedTask;
    }

    /* ── 参数校验 ── */

    private static string RequireKey(string? key)
    {
        if (string.IsNullOrEmpty(key))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "Security:key 不能为空");
        }
        return key;
    }

    /// <summary>
    /// 把 SecureStorage 的底层异常转成带指引的错误信封:
    /// 常见原因是设备不支持安全存储、加密密钥变更或数据损坏,
    /// 应用侧可捕获后调用 clear() 清空并重建。
    /// </summary>
    private static NapacitorException StorageException(string action, Exception ex) =>
        new(
            NapacitorException.Error,
            $"Security:{action}安全存储失败(设备不支持安全存储/加密密钥变更/数据损坏),可尝试 clear() 清空重建:{ex.Message}",
            ex);
}
