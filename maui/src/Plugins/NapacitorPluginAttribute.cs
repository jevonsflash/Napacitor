namespace Napacitor.Plugins;

/// <summary>
/// 标注一个 Napacitor 插件类(与 Capacitor Android 的 @CapacitorPlugin 对应)。
/// 插件名默认取类名去掉 "Plugin" 后缀,如 BatteryPlugin → "Battery"。
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class NapacitorPluginAttribute : Attribute
{
    public string Name { get; }

    public NapacitorPluginAttribute()
    {
        Name = string.Empty;
    }

    public NapacitorPluginAttribute(string name)
    {
        Name = name;
    }
}

/// <summary>
/// 标注一个可被 JS 调用的插件方法(与 Capacitor Android 的 @PluginMethod 对应)。
/// 未标注的公共方法不暴露给 JS。
/// </summary>
[AttributeUsage(AttributeTargets.Method, Inherited = false)]
public sealed class NapacitorMethodAttribute : Attribute
{
}

/// <summary>
/// Napacitor 插件契约。插件由运行时反射自动发现(对应 Capacitor Android
/// 注解处理器自动注册),宿主无需手动注册任何插件。
/// </summary>
public interface INapacitorPlugin
{
    /// <summary>插件注册名(JS 侧 registerPlugin 使用的名字)。</summary>
    string PluginName { get; }
}
