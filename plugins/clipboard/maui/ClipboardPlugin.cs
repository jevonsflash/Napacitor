namespace Napacitor.Plugins.Clipboard;

/// <summary>write() 参数结构(与 @capacitor/clipboard 的 WriteOptions 对应)。</summary>
public class ClipboardWriteOptions
{
    /// <summary>要写入的文本。</summary>
    public string? String { get; set; }

    /// <summary>要写入的图像(base64 data URI)——MAUI Essentials 剪贴板仅支持文本。</summary>
    public string? Image { get; set; }
}

/// <summary>read() 返回结构。</summary>
public class ClipboardReadResult
{
    public string Value { get; set; } = string.Empty;
}

/// <summary>
/// Clipboard 插件:系统剪贴板(与 @capacitor/clipboard 对应)。
/// 基于 MAUI Essentials 的 Clipboard 门面实现,仅支持文本。
/// </summary>
[NapacitorPlugin("Clipboard")]
public class ClipboardPlugin : NapacitorPluginBase
{
    /// <summary>写入剪贴板文本。</summary>
    [NapacitorMethod]
    public async Task Write(ClipboardWriteOptions options)
    {
        if (!string.IsNullOrEmpty(options.String))
        {
            await Microsoft.Maui.ApplicationModel.DataTransfer.Clipboard.Default.SetTextAsync(options.String);
            return;
        }
        if (!string.IsNullOrEmpty(options.Image))
        {
            throw NotImplemented("剪贴板图像写入(MAUI Essentials 剪贴板仅支持文本)");
        }
        throw new NapacitorException(
            NapacitorException.InvalidArguments,
            "Clipboard.write 需要提供 string 或 image 参数");
    }

    /// <summary>读取剪贴板文本(空剪贴板返回空字符串)。</summary>
    [NapacitorMethod]
    public async Task<ClipboardReadResult> Read()
    {
        var text = await Microsoft.Maui.ApplicationModel.DataTransfer.Clipboard.Default.GetTextAsync();
        return new ClipboardReadResult { Value = text ?? string.Empty };
    }
}
