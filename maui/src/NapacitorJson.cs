using System.Text.Json;

namespace Napacitor;

/// <summary>
/// Napacitor 共享 JSON 序列化选项:写出 camelCase,读取大小写不敏感
/// (JS 侧 camelCase ↔ C# 侧 PascalCase 双向互通)。
/// </summary>
public static class NapacitorJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };
}
