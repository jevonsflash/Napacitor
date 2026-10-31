using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Media;
using Microsoft.Maui.Storage;

namespace Napacitor.Plugins.Camera;

/* ─── 参数 / 结果 DTO ─────────────────────────────────────── */

/// <summary>选取或拍摄到的媒体文件。</summary>
public class MediaFileResult
{
    /// <summary>文件名。</summary>
    public string? Name { get; set; }

    /// <summary>平台可用时的物理路径(不可依赖)。</summary>
    public string? Path { get; set; }

    /// <summary>文件大小(字节)。</summary>
    public long Size { get; set; }

    /// <summary>媒体内容类型(如 'image/jpeg'),平台可用时返回。</summary>
    public string? ContentType { get; set; }

    /// <summary>base64 编码的文件内容。</summary>
    public string? Data { get; set; }
}

/// <summary>pickPhotos() / pickVideos() / capturePhoto() / captureVideo() 参数(对应 MAUI MediaPickerOptions)。</summary>
public class PickMediaOptions
{
    /// <summary>选择器标题(仅部分操作系统显示)。</summary>
    public string? Title { get; set; }

    /// <summary>选择数量上限(默认 1;0 表示不限制;Android 部分选择器 UI 不强制,Windows 不支持)。</summary>
    public int? SelectionLimit { get; set; }

    /// <summary>图像处理:最大宽度(像素,超出按比例缩放)。</summary>
    public int? MaximumWidth { get; set; }

    /// <summary>图像处理:最大高度(像素,超出按比例缩放)。</summary>
    public int? MaximumHeight { get; set; }

    /// <summary>图像处理:压缩质量 0-100(仅对支持的图像格式生效)。</summary>
    public int? CompressionQuality { get; set; }

    /// <summary>图像处理:是否按 EXIF 方向旋转图像(默认 true)。</summary>
    public bool? RotateImage { get; set; }

    /// <summary>图像处理:是否保留图像元数据。</summary>
    public bool? PreserveMetaData { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Camera 插件:拍照 / 录像 / 从媒体库选取照片与视频
/// (封装 MAUI MediaPicker API)。
/// </summary>
[NapacitorPlugin("Camera")]
public class CameraPlugin : NapacitorPluginBase
{
    /// <summary>设备是否支持拍照 / 录像。</summary>
    [NapacitorMethod]
    public Task<bool> IsCaptureSupported()
    {
        return Task.FromResult(MediaPicker.Default.IsCaptureSupported);
    }

    /// <summary>打开媒体浏览器选取一张或多张照片(取消返回空数组)。</summary>
    [NapacitorMethod]
    public async Task<MediaFileResult[]> PickPhotos(PickMediaOptions? options)
    {
        var files = await MainThread.InvokeOnMainThreadAsync(() =>
            MediaPicker.Default.PickPhotosAsync(BuildMediaOptions(options)));
        return await ReadMediaFilesAsync(files);
    }

    /// <summary>打开媒体浏览器选取一个或多个视频(取消返回空数组)。</summary>
    [NapacitorMethod]
    public async Task<MediaFileResult[]> PickVideos(PickMediaOptions? options)
    {
        var files = await MainThread.InvokeOnMainThreadAsync(() =>
            MediaPicker.Default.PickVideosAsync(BuildMediaOptions(options)));
        return await ReadMediaFilesAsync(files);
    }

    /// <summary>打开相机拍摄照片(取消返回 null)。</summary>
    [NapacitorMethod]
    public async Task<MediaFileResult?> CapturePhoto(PickMediaOptions? options)
    {
        FileResult? file = await MainThread.InvokeOnMainThreadAsync(() =>
            MediaPicker.Default.CapturePhotoAsync(BuildMediaOptions(options)));
        return file is null ? null : await ReadMediaFileAsync(file);
    }

    /// <summary>打开相机拍摄视频(取消返回 null)。</summary>
    [NapacitorMethod]
    public async Task<MediaFileResult?> CaptureVideo(PickMediaOptions? options)
    {
        FileResult? file = await MainThread.InvokeOnMainThreadAsync(() =>
            MediaPicker.Default.CaptureVideoAsync(BuildMediaOptions(options)));
        return file is null ? null : await ReadMediaFileAsync(file);
    }

    /* ─── 内部工具 ─────────────────────────────────────────── */

    private static MediaPickerOptions? BuildMediaOptions(PickMediaOptions? options)
    {
        if (options is null)
        {
            return null;
        }

        if (options.SelectionLimit is < 0)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"Camera:selectionLimit 不能为负数(收到 {options.SelectionLimit})");
        }

        if (options.CompressionQuality is < 0 or > 100)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"Camera:compressionQuality 须在 0-100 之间(收到 {options.CompressionQuality})");
        }

        var mediaOptions = new MediaPickerOptions();
        if (!string.IsNullOrWhiteSpace(options.Title))
        {
            mediaOptions.Title = options.Title;
        }
        if (options.SelectionLimit.HasValue)
        {
            mediaOptions.SelectionLimit = options.SelectionLimit.Value;
        }
        if (options.MaximumWidth.HasValue)
        {
            mediaOptions.MaximumWidth = options.MaximumWidth.Value;
        }
        if (options.MaximumHeight.HasValue)
        {
            mediaOptions.MaximumHeight = options.MaximumHeight.Value;
        }
        if (options.CompressionQuality.HasValue)
        {
            mediaOptions.CompressionQuality = options.CompressionQuality.Value;
        }
        if (options.RotateImage.HasValue)
        {
            mediaOptions.RotateImage = options.RotateImage.Value;
        }
        if (options.PreserveMetaData.HasValue)
        {
            mediaOptions.PreserveMetaData = options.PreserveMetaData.Value;
        }
        return mediaOptions;
    }

    private static async Task<MediaFileResult[]> ReadMediaFilesAsync(
        IEnumerable<FileResult> files)
    {
        var results = new List<MediaFileResult>();
        foreach (var file in files)
        {
            if (file is null)
            {
                continue;
            }
            results.Add(await ReadMediaFileAsync(file));
        }
        return results.ToArray();
    }

    private static async Task<MediaFileResult> ReadMediaFileAsync(FileResult file)
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

        return new MediaFileResult
        {
            Name = file.FileName,
            Path = TryGetFullPath(file),
            Size = data.Length,
            ContentType = file.ContentType,
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
}
