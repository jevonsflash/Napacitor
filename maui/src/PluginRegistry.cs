using System.Collections.Concurrent;
using System.Reflection;
using System.Text.Json;
using Napacitor.Plugins;

namespace Napacitor;

/// <summary>
/// 插件注册表:反射扫描以 "Napacitor" 开头的程序集,自动发现
/// [NapacitorPlugin] 标注的插件(对应 Capacitor Android 注解处理器
/// 生成的插件自动注册 —— 宿主零手动注册代码)。
/// </summary>
public sealed class PluginRegistry
{
    private readonly NapacitorRuntime _runtime;
    private readonly ConcurrentDictionary<string, INapacitorPlugin> _plugins =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<(string Plugin, string Method), MethodInfo> _methods =
        new(new PluginMethodComparer());

    private sealed class PluginMethodComparer : IEqualityComparer<(string Plugin, string Method)>
    {
        public bool Equals((string Plugin, string Method) x, (string Plugin, string Method) y) =>
            string.Equals(x.Plugin, y.Plugin, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(x.Method, y.Method, StringComparison.OrdinalIgnoreCase);

        public int GetHashCode((string Plugin, string Method) obj) =>
            HashCode.Combine(
                obj.Plugin.ToLowerInvariant(),
                obj.Method.ToLowerInvariant());
    }

    internal PluginRegistry(NapacitorRuntime runtime)
    {
        _runtime = runtime;
    }

    /// <summary>已发现插件的注册名(供注入 JS 的插件清单使用)。</summary>
    public IReadOnlyCollection<string> PluginNames => _plugins.Keys.ToList();

    /// <summary>
    /// 扫描所有已加载与入口程序集引用的 "Napacitor*" 程序集并实例化插件。
    /// </summary>
    public void DiscoverPlugins()
    {
        foreach (var assembly in GetNapacitorAssemblies())
        {
            Type[] types;
            try
            {
                types = assembly.GetTypes();
            }
            catch (ReflectionTypeLoadException ex)
            {
                types = ex.Types.Where(t => t is not null).Cast<Type>().ToArray();
            }

            foreach (var type in types)
            {
                if (type.IsAbstract || type.IsInterface || type.IsGenericTypeDefinition)
                {
                    continue;
                }

                var attr = type.GetCustomAttribute<NapacitorPluginAttribute>();
                if (attr is null || !typeof(INapacitorPlugin).IsAssignableFrom(type))
                {
                    continue;
                }

                var plugin = CreatePlugin(type);
                if (plugin is null)
                {
                    continue;
                }

                var name = ResolvePluginName(plugin, attr);
                _plugins.TryAdd(name, plugin);
            }
        }
    }

    private static string ResolvePluginName(INapacitorPlugin plugin, NapacitorPluginAttribute attr) =>
        !string.IsNullOrEmpty(attr.Name) ? attr.Name : plugin.PluginName;

    private INapacitorPlugin? CreatePlugin(Type type)
    {
        var ctor = type.GetConstructor(Type.EmptyTypes);
        if (ctor is null)
        {
            System.Diagnostics.Debug.WriteLine(
                $"[Napacitor] 跳过插件 {type.FullName}:缺少公共无参构造函数");
            return null;
        }

        var plugin = (INapacitorPlugin)ctor.Invoke(null);
        if (plugin is NapacitorPluginBase basis)
        {
            basis.Attach(_runtime, _runtime.GetPluginConfig(basis.PluginName));
        }
        return plugin;
    }

    /// <summary>枚举 Napacitor 运行时程序集 + 插件程序集(含尚未加载的引用)。</summary>
    private static IEnumerable<Assembly> GetNapacitorAssemblies()
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var queue = new Queue<Assembly>();

        var entry = Assembly.GetEntryAssembly();
        if (entry is not null)
        {
            queue.Enqueue(entry);
        }

        // 运行时自身(GetEntryAssembly 在 iOS/Mono 等平台可能为 null,兜底入队)
        queue.Enqueue(typeof(PluginRegistry).Assembly);

        // 已加载程序集:全部入队,不按名称过滤。Android/iOS 的入口是 Java/
        // Objective-C 运行时,GetEntryAssembly() 返回 null,若只入队 Napacitor*
        // 命名的程序集,会漏掉宿主 App.dll —— 它经 napacitor.build.props 静
        // 态引用了全部插件程序集,而运行时启动(Main.razor 所在)时它必然已加载,
        // 从它的引用链即可发现插件(配合下方 BFS 的 seen 去重,重复入队无害)。
        foreach (var loaded in AppDomain.CurrentDomain.GetAssemblies())
        {
            queue.Enqueue(loaded);
        }

        // 磁盘扫描兜底:宿主代码不静态引用插件,ILLink 会裁掉宿主→插件的
        // 程序集引用,仅靠引用链发现不了插件(App bundle 内程序集以文件形式存在)
        foreach (var path in EnumerateNapacitorAssemblyFiles())
        {
            try
            {
                queue.Enqueue(Assembly.LoadFrom(path));
            }
            catch
            {
                // 加载失败(非程序集/程序集已内嵌的平台),跳过
            }
        }

        while (queue.Count > 0)
        {
            var assembly = queue.Dequeue();
            if (!seen.Add(assembly.GetName().FullName))
            {
                continue;
            }

            if (IsNapacitorAssembly(assembly))
            {
                yield return assembly;
            }

            // 递归加载入口程序集引用链上的 Napacitor 程序集
            foreach (var refName in assembly.GetReferencedAssemblies())
            {
                if (!IsNapacitorAssemblyName(refName) || seen.Contains(refName.FullName))
                {
                    continue;
                }
                try
                {
                    queue.Enqueue(Assembly.Load(refName));
                }
                catch (Exception ex) when (ex is FileNotFoundException or FileLoadException)
                {
                    // 引用缺失(如剪裁/条件编译),跳过
                }
            }
        }
    }

    private static bool IsNapacitorAssembly(Assembly assembly) =>
        IsNapacitorAssemblyName(assembly.GetName());

    /// <summary>枚举 App 基目录下的 Napacitor*.dll(目录不可访问时返回空)。</summary>
    private static IEnumerable<string> EnumerateNapacitorAssemblyFiles()
    {
        try
        {
            return Directory.EnumerateFiles(
                AppContext.BaseDirectory, "Napacitor*.dll", SearchOption.TopDirectoryOnly);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return Array.Empty<string>();
        }
    }

    private static bool IsNapacitorAssemblyName(AssemblyName name) =>
        name.Name is not null && name.Name.StartsWith("Napacitor", StringComparison.OrdinalIgnoreCase);

    /// <summary>调用插件方法并返回结果信封 JSON。任何异常都转为错误信封。</summary>
    public async Task<string> InvokeAsync(string pluginId, string methodName, string argsJson)
    {
        if (!_plugins.TryGetValue(pluginId, out var plugin))
        {
            return Envelope.Error(
                NapacitorException.PluginNotFound,
                $"插件 {pluginId} 未注册(可用插件:{string.Join(", ", _plugins.Keys)})");
        }

        var method = ResolveMethod(plugin, pluginId, methodName);
        if (method is null)
        {
            return Envelope.Error(
                NapacitorException.NotImplemented,
                $"插件 {pluginId} 未实现方法 {methodName}");
        }

        try
        {
            var args = BuildArguments(method, argsJson);
            var result = method.Invoke(plugin, args);
            var value = await UnwrapResultAsync(result);
            return Envelope.Success(value);
        }
        catch (NapacitorException ex)
        {
            return Envelope.Error(ex.Code, ex.Message);
        }
        catch (TargetInvocationException ex)
        {
            return Envelope.FromException(ex.InnerException ?? ex);
        }
        catch (OperationCanceledException)
        {
            return Envelope.Error(NapacitorException.Canceled, "操作已取消");
        }
        catch (JsonException ex)
        {
            return Envelope.Error(NapacitorException.InvalidArguments, $"参数反序列化失败:{ex.Message}");
        }
        catch (Exception ex)
        {
            return Envelope.FromException(ex);
        }
    }

    private MethodInfo? ResolveMethod(INapacitorPlugin plugin, string pluginId, string methodName)
    {
        var key = (pluginId, methodName);
        if (_methods.TryGetValue(key, out var cached))
        {
            return cached;
        }

        foreach (var m in plugin.GetType().GetMethods(BindingFlags.Public | BindingFlags.Instance))
        {
            if (m.GetCustomAttribute<NapacitorMethodAttribute>() is null)
            {
                continue;
            }
            if (string.Equals(m.Name, methodName, StringComparison.OrdinalIgnoreCase))
            {
                _methods[key] = m;
                return m;
            }
        }
        return null;
    }

    /// <summary>按方法签名构造实参:0 参 / 1 个强类型 DTO / 1 个 NapacitorCall。</summary>
    private static object?[] BuildArguments(MethodInfo method, string argsJson)
    {
        var parameters = method.GetParameters();
        if (parameters.Length == 0)
        {
            return Array.Empty<object?>();
        }

        if (parameters.Length > 1)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"方法 {method.Name} 的签名不受支持:最多 1 个参数(强类型 DTO 或 NapacitorCall)");
        }

        var p = parameters[0];
        if (p.ParameterType == typeof(NapacitorCall))
        {
            return new object?[] { new NapacitorCall(ParseJson(argsJson)) };
        }

        try
        {
            var value = JsonSerializer.Deserialize(argsJson, p.ParameterType, NapacitorJson.Options);
            return new object?[] { value };
        }
        catch (JsonException ex)
        {
            throw new NapacitorException(
                NapacitorException.InvalidArguments,
                $"方法 {method.Name} 的参数反序列化失败:{ex.Message}", ex);
        }
    }

    private static JsonElement ParseJson(string argsJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(argsJson);
            return doc.RootElement.Clone();
        }
        catch (JsonException)
        {
            return default;
        }
    }

    /// <summary>解包 Task / Task&lt;T&gt; / ValueTask / ValueTask&lt;T&gt; 的结果。</summary>
    private static async Task<object?> UnwrapResultAsync(object? result)
    {
        switch (result)
        {
            case null:
                return null;
            case Task task:
                await task.ConfigureAwait(false);
                return ExtractTaskResult(task);
            default:
            {
                var type = result.GetType();
                if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ValueTask<>))
                {
                    var asTask = type.GetMethod("AsTask", Type.EmptyTypes);
                    var boxed = asTask!.Invoke(result, null);
                    return await UnwrapResultAsync(boxed);
                }
                if (result is ValueTask valueTask)
                {
                    await valueTask.AsTask().ConfigureAwait(false);
                    return null;
                }
                return result;
            }
        }
    }

    private static object? ExtractTaskResult(Task task)
    {
        var type = task.GetType();
        if (!type.IsGenericType || type.GetGenericTypeDefinition() != typeof(Task<>))
        {
            return null;
        }
        return type.GetProperty("Result")?.GetValue(task);
    }

    /// <summary>查找已实例化的插件(供监听器生命周期使用)。</summary>
    internal INapacitorPlugin? FindPlugin(string pluginId) =>
        _plugins.TryGetValue(pluginId, out var plugin) ? plugin : null;
}

/// <summary>调用结果信封:JS 侧按 {ok, data|error} 解包。</summary>
internal static class Envelope
{
    public static string Success(object? data)
    {
        if (data is null)
        {
            return "{\"ok\":true,\"data\":null}";
        }
        return JsonSerializer.Serialize(
            new ResultEnvelope { Ok = true, Data = data }, NapacitorJson.Options);
    }

    public static string Error(string code, string message)
    {
        return JsonSerializer.Serialize(
            new ResultEnvelope
            {
                Ok = false,
                Error = new EnvelopeError { Code = code, Message = message },
            },
            NapacitorJson.Options);
    }

    public static string FromException(Exception ex) =>
        Error(ex is NapacitorException npe ? npe.Code : NapacitorException.Error, ex.Message);

    private sealed class ResultEnvelope
    {
        public bool Ok { get; set; }
        public object? Data { get; set; }
        public EnvelopeError? Error { get; set; }
    }

    private sealed class EnvelopeError
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
