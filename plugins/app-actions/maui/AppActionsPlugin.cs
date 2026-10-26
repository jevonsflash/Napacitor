using Microsoft.Maui.ApplicationModel;

namespace Napacitor.Plugins.AppActions;

/* ─── DTO ─────────────────────────────────────────────────── */

/// <summary>快捷方式定义(set 参数 / get 返回 / 事件载荷共用)。</summary>
public class AppActionInfoDto
{
    /// <summary>唯一标识(用于响应点击时区分操作)。</summary>
    public string? Id { get; set; }

    /// <summary>显示标题。</summary>
    public string? Title { get; set; }

    /// <summary>副标题(平台支持时显示在标题下方)。</summary>
    public string? Subtitle { get; set; }

    /// <summary>图标(需与各平台资源目录中的图标匹配)。</summary>
    public string? Icon { get; set; }
}

/// <summary>set() 参数。</summary>
public class AppActionsSetOptions
{
    /// <summary>要设置的快捷方式列表(整体替换当前列表)。</summary>
    public List<AppActionInfoDto>? Actions { get; set; }
}

/// <summary>get() 返回值。</summary>
public class AppActionsGetResult
{
    /// <summary>当前已设置的快捷方式列表。</summary>
    public List<AppActionInfoDto> Actions { get; set; } = new();
}

/// <summary>isSupported() 返回值。</summary>
public class AppActionsSupportedResult
{
    /// <summary>当前平台是否支持应用快捷方式。</summary>
    public bool Supported { get; set; }
}

/// <summary>appActionPerformed 事件载荷。</summary>
public class AppActionPerformedResult
{
    /// <summary>被触发的快捷方式。</summary>
    public AppActionInfoDto Action { get; set; } = new();
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// AppActions 插件:应用图标快捷方式的设置与查询
/// (封装 MAUI AppActions.Default.SetAsync / GetAsync / IsSupported)。
///
/// 事件管线:MAUI 的快捷方式点击回调注册在宿主启动时
/// (ConfigureEssentials(essentials => essentials.OnAppAction(...))),
/// 插件无法自行订阅 —— 宿主在回调中调用 <see cref="NotifyActionPerformed"/>
/// 转发给 JS(见插件 README);插件实例尚未创建时静默忽略。
/// </summary>
[NapacitorPlugin("AppActions")]
public class AppActionsPlugin : NapacitorPluginBase
{
    private const string AppActionPerformedEvent = "appActionPerformed";

    /// <summary>当前插件实例(供宿主静态转发入口使用)。</summary>
    private static AppActionsPlugin? _current;

    public AppActionsPlugin()
    {
        _current = this;
    }

    /// <summary>检查当前平台是否支持应用快捷方式。</summary>
    [NapacitorMethod]
    public Task<AppActionsSupportedResult> IsSupported()
    {
        return Task.FromResult(new AppActionsSupportedResult
        {
            Supported = Microsoft.Maui.ApplicationModel.AppActions.IsSupported,
        });
    }

    /// <summary>设置应用快捷方式(整体替换当前列表)。</summary>
    [NapacitorMethod]
    public Task Set(AppActionsSetOptions options)
    {
        var dtos = options.Actions ?? new List<AppActionInfoDto>();
        var actions = new List<AppAction>(dtos.Count);
        foreach (var dto in dtos)
        {
            if (string.IsNullOrWhiteSpace(dto.Id) || string.IsNullOrWhiteSpace(dto.Title))
            {
                throw new NapacitorException(
                    NapacitorException.InvalidArguments,
                    "AppActions:每个快捷方式的 id 与 title 均不能为空");
            }
            actions.Add(ToAppAction(dto));
        }
        return Microsoft.Maui.ApplicationModel.AppActions.Current.SetAsync(actions);
    }

    /// <summary>获取当前已设置的应用快捷方式。</summary>
    [NapacitorMethod]
    public async Task<AppActionsGetResult> Get()
    {
        var actions = await Microsoft.Maui.ApplicationModel.AppActions.Current.GetAsync();
        return new AppActionsGetResult
        {
            Actions = actions.Select(ToDto).ToList(),
        };
    }

    /* ── 宿主转发入口 ── */

    /// <summary>
    /// 宿主在 MauiProgram 的 ConfigureEssentials 回调中调用:
    /// essentials.OnAppAction(action => AppActionsPlugin.NotifyActionPerformed(action)),
    /// 将快捷方式点击转发给 JS(appActionPerformed 事件;无 JS 监听器时静默忽略)。
    /// </summary>
    public static void NotifyActionPerformed(AppAction action)
    {
        _current?.NotifyListeners(AppActionPerformedEvent, new AppActionPerformedResult
        {
            Action = ToDto(action),
        });
    }

    /* ── 映射 ── */

    private static AppAction ToAppAction(AppActionInfoDto dto)
    {
        if (dto.Subtitle is not null || dto.Icon is not null)
        {
            return new AppAction(
                dto.Id!, dto.Title!, dto.Subtitle ?? string.Empty, dto.Icon ?? string.Empty);
        }
        return new AppAction(dto.Id!, dto.Title!);
    }

    private static AppActionInfoDto ToDto(AppAction action) => new()
    {
        Id = action.Id,
        Title = action.Title,
        Subtitle = action.Subtitle,
        // MAUI AppAction 未暴露 Icon 读取器(仅构造入参),故不回传
    };
}
