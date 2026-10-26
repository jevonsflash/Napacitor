using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace Napacitor.Plugins.Dialog;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>alert() 参数。</summary>
public class DialogAlertOptions
{
    /// <summary>对话框标题。</summary>
    public string? Title { get; set; }

    /// <summary>对话框消息。</summary>
    public string? Message { get; set; }

    /// <summary>按钮文案(默认 'OK')。</summary>
    public string? ButtonTitle { get; set; }
}

/// <summary>prompt() 参数。</summary>
public class DialogPromptOptions
{
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? OkButtonTitle { get; set; }
    public string? CancelButtonTitle { get; set; }
    public string? InputPlaceholder { get; set; }
    public string? InputText { get; set; }
}

/// <summary>prompt() 返回值。</summary>
public class DialogPromptResult
{
    public string Value { get; set; } = string.Empty;
    public bool Cancelled { get; set; }
}

/// <summary>confirm() 参数。</summary>
public class DialogConfirmOptions
{
    public string? Title { get; set; }
    public string? Message { get; set; }
    public string? OkButtonTitle { get; set; }
    public string? CancelButtonTitle { get; set; }
}

/// <summary>confirm() 返回值。</summary>
public class DialogConfirmResult
{
    public bool Value { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Dialog 插件:原生对话框(映射 MAUI Page.DisplayAlert / DisplayPromptAsync;
/// Windows 上由 MAUI 落到 ContentDialog)。
/// </summary>
[NapacitorPlugin("Dialog")]
public class DialogPlugin : NapacitorPluginBase
{
    /// <summary>显示警告对话框(单按钮)。</summary>
    [NapacitorMethod]
    public Task Alert(DialogAlertOptions options)
    {
        var page = CurrentPage();
        return MainThread.InvokeOnMainThreadAsync(() => page.DisplayAlert(
            options.Title ?? string.Empty,
            options.Message ?? string.Empty,
            OrDefault(options.ButtonTitle, "OK")));
    }

    /// <summary>显示输入对话框(取消时 value 为空串、cancelled 为 true)。</summary>
    [NapacitorMethod]
    public async Task<DialogPromptResult> Prompt(DialogPromptOptions options)
    {
        var page = CurrentPage();
        var result = await MainThread.InvokeOnMainThreadAsync(() => page.DisplayPromptAsync(
            options.Title ?? string.Empty,
            options.Message ?? string.Empty,
            OrDefault(options.OkButtonTitle, "OK"),
            OrDefault(options.CancelButtonTitle, "Cancel"),
            options.InputPlaceholder,
            initialValue: options.InputText ?? string.Empty));
        return new DialogPromptResult
        {
            Value = result ?? string.Empty,
            Cancelled = result is null,
        };
    }

    /// <summary>显示确认对话框。</summary>
    [NapacitorMethod]
    public async Task<DialogConfirmResult> Confirm(DialogConfirmOptions options)
    {
        var page = CurrentPage();
        var ok = await MainThread.InvokeOnMainThreadAsync(() => page.DisplayAlert(
            options.Title ?? string.Empty,
            options.Message ?? string.Empty,
            OrDefault(options.OkButtonTitle, "OK"),
            OrDefault(options.CancelButtonTitle, "Cancel")));
        return new DialogConfirmResult { Value = ok };
    }

    /* ── 页面定位(宿主窗口未创建 / 无页面时抛 UNAVAILABLE)── */

    private static Page CurrentPage()
    {
        var app = Application.Current;
        return (app?.Windows?.FirstOrDefault()?.Page ?? app?.MainPage)
            ?? throw new NapacitorException(
                NapacitorException.Unavailable, "Dialog:当前无可用页面(宿主窗口尚未创建)");
    }

    private static string OrDefault(string? value, string fallback) =>
        string.IsNullOrEmpty(value) ? fallback : value;
}
