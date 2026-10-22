namespace Napacitor;

/// <summary>
/// 带 machine-readable 错误码的异常(与 Capacitor 的 PluginError 对应)。
/// JS 侧收到 code 后以 NapacitorException(code, message) 形式抛出。
/// </summary>
public class NapacitorException : Exception
{
    public const string PluginNotFound = "PLUGIN_NOT_FOUND";
    public const string NotImplemented = "NOT_IMPLEMENTED";
    public const string InvalidArguments = "INVALID_ARGUMENTS";
    public const string Canceled = "CANCELED";
    public const string Error = "ERROR";
    public const string Unavailable = "UNAVAILABLE";
    public const string Unsupported = "UNSUPPORTED";

    /// <summary>机器可读错误码,如 'NOT_IMPLEMENTED'。</summary>
    public string Code { get; }

    public NapacitorException(string code, string message) : base(message)
    {
        Code = code;
    }

    public NapacitorException(string code, string message, Exception innerException)
        : base(message, innerException)
    {
        Code = code;
    }
}
