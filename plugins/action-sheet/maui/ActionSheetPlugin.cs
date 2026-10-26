using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace Napacitor.Plugins.ActionSheet;

/* ─── 参数 / 返回 DTO ─────────────────────────────────────── */

/// <summary>操作表按钮。</summary>
public class ActionSheetButton
{
    /// <summary>按钮文案。</summary>
    public string? Title { get; set; }

    /// <summary>按钮风格(DEFAULT/DESTRUCTIVE/CANCEL;仅 iOS 语义,当前忽略)。</summary>
    public string? Style { get; set; }
}

/// <summary>showActions() 参数。</summary>
public class ShowActionsOptions
{
    /// <summary>操作表标题。</summary>
    public string? Title { get; set; }

    /// <summary>标题下的消息(仅 iOS 语义,DisplayActionSheet 无对应参数)。</summary>
    public string? Message { get; set; }

    /// <summary>可选项。</summary>
    public List<ActionSheetButton>? Options { get; set; }

    /// <summary>点击表外区域是否可取消(默认 false)。</summary>
    public bool? Cancelable { get; set; }
}

/// <summary>showActions() 返回值。</summary>
public class ShowActionsResult
{
    /// <summary>被点击选项的下标(从 0 起);被取消时为 -1。</summary>
    public int Index { get; set; } = -1;

    /// <summary>是否被取消。</summary>
    public bool Canceled { get; set; } = true;
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// ActionSheet 插件:原生操作表(映射 MAUI Page.DisplayActionSheet)。
/// </summary>
[NapacitorPlugin("ActionSheet")]
public class ActionSheetPlugin : NapacitorPluginBase
{
    /// <summary>显示操作表;被取消时 index 为 -1、canceled 为 true。</summary>
    [NapacitorMethod]
    public async Task<ShowActionsResult> ShowActions(ShowActionsOptions options)
    {
        var buttons = options.Options?
            .Where(o => !string.IsNullOrEmpty(o.Title))
            .Select(o => o.Title!)
            .ToArray() ?? Array.Empty<string>();
        if (buttons.Length == 0)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "ActionSheet.showActions:options 不能为空");
        }

        var app = Application.Current;
        var page = (app?.Windows?.FirstOrDefault()?.Page ?? app?.MainPage)
            ?? throw new NapacitorException(
                NapacitorException.Unavailable, "ActionSheet:当前无可用页面(宿主窗口尚未创建)");

        // cancelable 时提供取消按钮(DisplayActionSheet 不传 cancel 则点外无法收起)
        var cancel = options.Cancelable == true ? "Cancel" : null;
        var choice = await MainThread.InvokeOnMainThreadAsync(
            () => page.DisplayActionSheet(options.Title ?? string.Empty, cancel, null, buttons));

        var index = choice is null ? -1 : Array.IndexOf(buttons, choice);
        return new ShowActionsResult { Index = index, Canceled = index < 0 };
    }
}
