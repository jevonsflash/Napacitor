using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Storage;

namespace Napacitor.Plugins.FileViewer;

/* ─── 参数 DTO ─────────────────────────────────────────────── */

/// <summary>openDocumentFromLocalPath() 参数。</summary>
public class OpenFromLocalPathOptions
{
    /// <summary>文件的绝对路径。</summary>
    public string? Path { get; set; }
}

/// <summary>openDocumentFromResources() 参数。</summary>
public class OpenFromResourcesOptions
{
    /// <summary>应用包内资源的相对路径(Resources/Raw 下)。</summary>
    public string? Path { get; set; }
}

/// <summary>openDocumentFromUrl() 参数。</summary>
public class OpenFromUrlOptions
{
    /// <summary>指向文件的远程地址。</summary>
    public string? Url { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// FileViewer 插件:用系统查看器打开文件(封装 MAUI Launcher.OpenAsync /
/// FileSystem API;Android:Intent.ACTION_VIEW / iOS:分享面板交给系统 /
/// Windows:Shell 默认打开方式)。
/// </summary>
[NapacitorPlugin("FileViewer")]
public class FileViewerPlugin : NapacitorPluginBase
{
    /// <summary>打开本地文件系统中的文件(需设备上存在可处理该类型的查看器)。</summary>
    [NapacitorMethod]
    public Task OpenDocumentFromLocalPath(OpenFromLocalPathOptions options)
    {
        var path = RequirePath(options.Path);
        if (!File.Exists(path))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, $"FileViewer:文件不存在({path})");
        }
        return Launcher.Default.OpenAsync(new OpenFileRequest
        {
            File = new ReadOnlyFile(path),
        });
    }

    /// <summary>打开应用包内资源文件(复制到缓存目录后交给系统查看器)。</summary>
    [NapacitorMethod]
    public async Task OpenDocumentFromResources(OpenFromResourcesOptions options)
    {
        var path = RequirePath(options.Path);

        Stream stream;
        try
        {
            stream = await FileSystem.Current.OpenAppPackageFileAsync(path);
        }
        catch (FileNotFoundException)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"FileViewer:应用包内资源不存在({path};应位于 Resources/Raw 下)");
        }

        await using (stream)
        {
            var target = System.IO.Path.Combine(
                FileSystem.Current.CacheDirectory, System.IO.Path.GetFileName(path));
            await using (var file = File.Create(target))
            {
                await stream.CopyToAsync(file);
            }
            await Launcher.Default.OpenAsync(new OpenFileRequest
            {
                File = new ReadOnlyFile(target),
            });
        }
    }

    /// <summary>打开远程文件(交由系统浏览器/下载器处理)。</summary>
    [NapacitorMethod]
    public Task OpenDocumentFromUrl(OpenFromUrlOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Url) ||
            !Uri.TryCreate(options.Url, UriKind.Absolute, out var uri))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "FileViewer:url 必须为合法的绝对地址");
        }
        return Launcher.Default.OpenAsync(uri);
    }

    private static string RequirePath(string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "FileViewer:path 不能为空");
        }
        return path;
    }
}
