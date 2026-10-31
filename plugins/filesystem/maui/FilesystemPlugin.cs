using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Storage;

namespace Napacitor.Plugins.Filesystem;

/* ─── 参数 / 结果 DTO ─────────────────────────────────────── */

/// <summary>目录路径查询结果。</summary>
public class DirectoryPathsResult
{
    /// <summary>缓存目录(系统可能清理)。</summary>
    public string? CacheDirectory { get; set; }

    /// <summary>应用数据目录(随系统备份同步)。</summary>
    public string? DataDirectory { get; set; }
}

/// <summary>readBundleFile() 参数。</summary>
public class ReadBundleFileOptions
{
    /// <summary>应用包内资源路径(Resources/Raw 下)。</summary>
    public string? Path { get; set; }
}

/// <summary>readBundleFile() 结果。</summary>
public class BundleFileResult
{
    /// <summary>文件文本内容(UTF-8)。</summary>
    public string? Data { get; set; }
}

/// <summary>copyBundleFile() 参数。</summary>
public class CopyBundleFileOptions
{
    /// <summary>应用包内资源路径(Resources/Raw 下)。</summary>
    public string? Path { get; set; }

    /// <summary>目标目录:'cache' / 'data'(默认 'cache')。</summary>
    public string? TargetDirectory { get; set; }

    /// <summary>目标文件名(默认与源文件同名)。</summary>
    public string? FileName { get; set; }
}

/// <summary>copyBundleFile() 结果。</summary>
public class CopyBundleFileResult
{
    /// <summary>复制后的文件绝对路径。</summary>
    public string? Path { get; set; }
}

/// <summary>pickFile() / pickFiles() 参数。</summary>
public class PickFileOptions
{
    /// <summary>选择器标题(Windows 上不显示)。</summary>
    public string? Title { get; set; }

    /// <summary>文件类型过滤:'any' / 'images' / 'videos'(默认 'any')。</summary>
    public string? Types { get; set; }
}

/// <summary>选取到的文件。</summary>
public class PickedFileResult
{
    /// <summary>文件名。</summary>
    public string? Name { get; set; }

    /// <summary>平台可用时的物理路径(不可依赖)。</summary>
    public string? Path { get; set; }

    /// <summary>文件大小(字节)。</summary>
    public long Size { get; set; }

    /// <summary>base64 编码的文件内容。</summary>
    public string? Data { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Filesystem 插件:文件系统路径与捆绑文件访问 + 系统文件选择器
/// (封装 MAUI FileSystem / FilePicker API)。
/// </summary>
[NapacitorPlugin("Filesystem")]
public class FilesystemPlugin : NapacitorPluginBase
{
    /// <summary>获取缓存目录与应用数据目录的路径。</summary>
    [NapacitorMethod]
    public Task<DirectoryPathsResult> GetDirectoryPaths()
    {
        return Task.FromResult(new DirectoryPathsResult
        {
            CacheDirectory = FileSystem.Current.CacheDirectory,
            DataDirectory = FileSystem.Current.AppDataDirectory,
        });
    }

    /// <summary>读取应用包内捆绑文件的文本内容(Resources/Raw 下)。</summary>
    [NapacitorMethod]
    public async Task<BundleFileResult> ReadBundleFile(ReadBundleFileOptions options)
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
                $"Filesystem:应用包内资源不存在({path};应位于 Resources/Raw 下)");
        }

        await using (stream)
        using (var reader = new StreamReader(stream))
        {
            return new BundleFileResult { Data = await reader.ReadToEndAsync() };
        }
    }

    /// <summary>将应用包内捆绑文件复制到缓存目录或数据目录。</summary>
    [NapacitorMethod]
    public async Task<CopyBundleFileResult> CopyBundleFile(CopyBundleFileOptions options)
    {
        var path = RequirePath(options.Path);

        var targetDir = options.TargetDirectory?.ToLowerInvariant() switch
        {
            null or "cache" => FileSystem.Current.CacheDirectory,
            "data" => FileSystem.Current.AppDataDirectory,
            var other => throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"Filesystem:targetDirectory 仅支持 'cache' / 'data'(收到 '{other}')"),
        };

        var fileName = string.IsNullOrWhiteSpace(options.FileName)
            ? System.IO.Path.GetFileName(path)
            : options.FileName!;

        Stream stream;
        try
        {
            stream = await FileSystem.Current.OpenAppPackageFileAsync(path);
        }
        catch (FileNotFoundException)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"Filesystem:应用包内资源不存在({path};应位于 Resources/Raw 下)");
        }

        await using (stream)
        {
            var target = System.IO.Path.Combine(targetDir, fileName);
            await using (var file = File.Create(target))
            {
                await stream.CopyToAsync(file);
            }
            return new CopyBundleFileResult { Path = target };
        }
    }

    /// <summary>打开系统文件选择器选取单个文件(取消返回 null)。</summary>
    [NapacitorMethod]
    public async Task<PickedFileResult?> PickFile(PickFileOptions? options)
    {
        // FilePicker 必须在 UI 线程调用(MAUI 官方要求),读取内容在线程外进行。
        FileResult? file = await MainThread.InvokeOnMainThreadAsync(() =>
            FilePicker.Default.PickAsync(BuildPickOptions(options)));
        if (file is null)
        {
            return null;
        }
        return await ReadPickedFileAsync(file);
    }

    /// <summary>打开系统文件选择器选取多个文件(取消返回空数组)。</summary>
    [NapacitorMethod]
    public async Task<PickedFileResult[]> PickFiles(PickFileOptions? options)
    {
        IEnumerable<FileResult?>? files = await MainThread.InvokeOnMainThreadAsync(() =>
            FilePicker.Default.PickMultipleAsync(BuildPickOptions(options)));
        if (files is null)
        {
            return Array.Empty<PickedFileResult>();
        }

        var results = new List<PickedFileResult>();
        foreach (var file in files)
        {
            if (file is null)
            {
                continue;
            }
            results.Add(await ReadPickedFileAsync(file));
        }
        return results.ToArray();
    }

    /* ─── 内部工具 ─────────────────────────────────────────── */

    private static PickOptions? BuildPickOptions(PickFileOptions? options)
    {
        if (options is null)
        {
            return null;
        }

        var pickOptions = new PickOptions();
        if (!string.IsNullOrWhiteSpace(options.Title))
        {
            pickOptions.PickerTitle = options.Title;
        }

        pickOptions.FileTypes = options.Types?.ToLowerInvariant() switch
        {
            null or "any" => null,
            "images" => FilePickerFileType.Images,
            "videos" => FilePickerFileType.Videos,
            var other => throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"Filesystem:types 仅支持 'any' / 'images' / 'videos'(收到 '{other}')"),
        };
        return pickOptions;
    }

    private static async Task<PickedFileResult> ReadPickedFileAsync(FileResult file)
    {
        byte[] data;
        await using (var stream = await file.OpenReadAsync())
        await using (var buffer = new MemoryStream())
        {
            // 平台流(如 Android ContentResolver 流)可能不支持 Length,
            // 统一缓冲到 MemoryStream 再取字节。
            await stream.CopyToAsync(buffer);
            data = buffer.ToArray();
        }

        return new PickedFileResult
        {
            Name = file.FileName,
            Path = TryGetFullPath(file),
            Size = data.Length,
            Data = Convert.ToBase64String(data),
        };
    }

    /// <summary>FullPath 并不总返回物理路径(且可能抛异常),失败时置空。</summary>
    private static string? TryGetFullPath(FileResult file)
    {
        try
        {
            return file.FullPath;
        }
        catch
        {
            return null;
        }
    }

    private static string RequirePath(string? path)
    {
        if (string.IsNullOrEmpty(path))
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments, "Filesystem:path 不能为空");
        }
        return path;
    }
}
