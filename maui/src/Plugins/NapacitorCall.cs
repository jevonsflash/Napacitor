using System.Text.Json;

namespace Napacitor.Plugins;

/// <summary>
/// 松散类型的插件方法参数(与 Capacitor Android 的 @PluginMethod(PluginCall) 对应)。
/// 供不想声明强类型 options DTO 的方法使用。
/// </summary>
public sealed class NapacitorCall
{
    /// <summary>原始 JSON 参数(可能为空对象)。</summary>
    public JsonElement Data { get; }

    public NapacitorCall(JsonElement data)
    {
        Data = data.ValueKind == JsonValueKind.Object ? data : default;
    }

    /// <summary>读取强类型值;缺省或类型不符时返回 default。</summary>
    public T? Get<T>(string key)
    {
        if (Data.ValueKind != JsonValueKind.Object)
        {
            return default;
        }

        foreach (var prop in Data.EnumerateObject())
        {
            if (string.Equals(prop.Name, key, StringComparison.OrdinalIgnoreCase))
            {
                if (prop.Value.ValueKind == JsonValueKind.Null)
                {
                    return default;
                }
                try
                {
                    return prop.Value.Deserialize<T>(NapacitorJson.Options);
                }
                catch (JsonException)
                {
                    return default;
                }
            }
        }
        return default;
    }

    public string? GetString(string key) => Get<string>(key);

    public double? GetDouble(string key) => Get<double?>(key);

    public int? GetInt(string key) => Get<int?>(key);

    public bool? GetBool(string key) => Get<bool?>(key);
}
