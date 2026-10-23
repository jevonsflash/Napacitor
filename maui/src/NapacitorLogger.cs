namespace Napacitor;

/// <summary>日志行为(与 napacitor.config.json 的 loggingBehavior 对应,语义同 Capacitor)。</summary>
public enum LoggingBehavior
{
    /// <summary>永不输出日志。</summary>
    None,

    /// <summary>仅 Debug 构建输出(缺省)。</summary>
    Debug,

    /// <summary>始终输出(含 Release)。</summary>
    Production,
}

/// <summary>
/// 运行时统一日志器(与 Capacitor Android 的 Logger 对应)。
/// 由 napacitor.config.json 的 loggingBehavior 驱动:
/// <c>none</c>=不输出;<c>debug</c>=仅 Debug 构建(缺省);<c>production</c>=始终输出。
/// 覆盖 C# 运行时日志与从 JS 转发的 console 语句(见 <see cref="FromJavaScript"/>)。
/// 输出通道:Console(控制台 / logcat)+ Debug(IDE 诊断输出)双写。
/// </summary>
public static class NapacitorLogger
{
    /// <summary>当前行为(配置加载前取缺省 Debug,加载后由运行时 Configure)。</summary>
    private static LoggingBehavior _behavior = LoggingBehavior.Debug;

    /// <summary>当前是否输出日志。</summary>
    public static bool IsEnabled =>
        _behavior switch
        {
            LoggingBehavior.None => false,
            LoggingBehavior.Production => true,
            _ => IsDebugBuild(),
        };

    /// <summary>应用 napacitor.config.json 的 loggingBehavior(非法值回退 Debug)。</summary>
    public static void Configure(string? value)
    {
        _behavior = value?.Trim().ToLowerInvariant() switch
        {
            "none" => LoggingBehavior.None,
            "production" => LoggingBehavior.Production,
            _ => LoggingBehavior.Debug,
        };
    }

    /// <summary>一般信息(启动流程、插件发现、入口导入等)。</summary>
    public static void Info(string message) => Write(" ", message);

    /// <summary>警告(可恢复的异常路径,如事件分发失败)。</summary>
    public static void Warn(string message) => Write("[warn] ", message);

    /// <summary>错误。</summary>
    public static void Error(string message) => Write("[error] ", message);

    /// <summary>
    /// JS console 转发入口(原生桥经 NapacitorBridge.NAP_log 调用)。
    /// level:debug / info / warn / error(未知按 info 处理)。
    /// </summary>
    public static void FromJavaScript(string? level, string? message)
    {
        var text = message ?? string.Empty;
        switch (level?.Trim().ToLowerInvariant())
        {
            case "warn":
                Warn($"[JS] {text}");
                break;
            case "error":
                Error($"[JS] {text}");
                break;
            default:
                Info($"[JS] {text}");
                break;
        }
    }

    private static void Write(string level, string? message)
    {
        if (!IsEnabled)
        {
            return;
        }
        var line = $"[Napacitor]{level}{message ?? string.Empty}";
        Console.WriteLine(line);
        System.Diagnostics.Debug.WriteLine(line);
    }

    private static bool IsDebugBuild()
    {
#if DEBUG
        return true;
#else
        return false;
#endif
    }
}
