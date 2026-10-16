using Microsoft.Maui.ApplicationModel.DataTransfer;

namespace Napacitor.Plugins.Share;

/// <summary>share() 参数结构(与 @capacitor/share 的 ShareOptions 对应)。</summary>
public class ShareOptions
{
    /// <summary>分享主题(映射到 ShareTextRequest.Subject)。</summary>
    public string? Title { get; set; }

    /// <summary>分享文本。</summary>
    public string? Text { get; set; }

    /// <summary>分享链接。</summary>
    public string? Url { get; set; }

    /// <summary>分享面板标题(映射到 ShareRequestBase.Title)。</summary>
    public string? DialogTitle { get; set; }
}

/// <summary>canShare() 返回结构。</summary>
public class CanShareResult
{
    public bool CanShare { get; set; }
}

/// <summary>
/// Share 插件:系统分享(与 @capacitor/share 对应)。
/// 基于 MAUI Essentials 的 Share 门面实现。
/// </summary>
[NapacitorPlugin("Share")]
public class SharePlugin : NapacitorPluginBase
{
    /// <summary>弹出系统分享面板。</summary>
    [NapacitorMethod]
    public async Task Share(ShareOptions options)
    {
        if (string.IsNullOrEmpty(options.Text) && string.IsNullOrEmpty(options.Url))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                "Share.share 需要提供 text 或 url 参数");
        }

        await Microsoft.Maui.ApplicationModel.DataTransfer.Share.Default.RequestAsync(
            new ShareTextRequest
            {
                Subject = options.Title,
                Text = options.Text,
                Uri = options.Url,
                Title = options.DialogTitle,
            });
    }

    /// <summary>当前平台是否支持分享(MAUI 各目标平台均支持,恒为 true)。</summary>
    [NapacitorMethod]
    public Task<CanShareResult> CanShare()
    {
        return Task.FromResult(new CanShareResult { CanShare = true });
    }
}
