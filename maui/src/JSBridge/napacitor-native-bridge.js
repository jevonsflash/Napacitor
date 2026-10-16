/**
 * napacitor-native-bridge —— dist/native-bridge.js
 *
 * 注意:本文件为 src/native-bridge.ts 的构建产物(导出剥离、可直接 eval 的
 * 纯脚本形态;已提交,可用 npm run build:native-bridge 配合打包器再生成)。
 * 由 C# NapacitorRuntime 作为内嵌资源注入 WebView,先于 Web 应用脚本执行。
 */
(function () {
  'use strict';

  /** Napacitor 运行时程序集名(C# 侧程序集即 Napacitor)。 */
  var NAPACITOR_ASSEMBLY = 'Napacitor';

  /** callbackId → 监听器。 */
  var listeners = new Map();
  var listenerSeq = 0;

  function getNativeInfo() {
    return window.NapacitorNative;
  }

  function getDotNet() {
    return window.DotNet;
  }

  function rejectNoBridge() {
    return Promise.reject(
      new NapacitorException(
        'BRIDGE_NOT_AVAILABLE',
        'window.DotNet 不可用 —— Napacitor 原生桥必须在 .NET MAUI BlazorWebView 中运行',
      ),
    );
  }

  /** 带 code 的异常(与 Capacitor 的 Exception 对应)。 */
  function NapacitorException(code, message) {
    var err = new Error(message);
    err.name = 'NapacitorException';
    err.code = code;
    return err;
  }

  /** 调用 C# 插件方法,解包信封并抛出 NapacitorException。 */
  function invoke(pluginId, methodName, options) {
    var dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
      return rejectNoBridge();
    }
    return dotnet
      .invokeMethodAsync(
        NAPACITOR_ASSEMBLY,
        'NAP_invoke',
        pluginId,
        methodName,
        JSON.stringify(options || {}),
      )
      .then(function (raw) {
        var envelope = JSON.parse(raw);
        if (envelope.ok) {
          return envelope.data;
        }
        var err = envelope.error || { code: 'ERROR', message: '未知错误' };
        throw NapacitorException(err.code, err.message);
      });
  }

  function removeListenerById(callbackId) {
    if (!listeners.delete(callbackId)) {
      return Promise.resolve();
    }
    var dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
      return Promise.resolve();
    }
    return dotnet.invokeMethodAsync(
      NAPACITOR_ASSEMBLY,
      'NAP_removeListener',
      callbackId,
    );
  }

  /** 注册事件监听器,返回可 remove 的句柄。 */
  function addListener(pluginId, eventName, listener) {
    var dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
      return rejectNoBridge();
    }
    var callbackId = pluginId + '.' + eventName + '.' + ++listenerSeq;
    listeners.set(callbackId, {
      callbackId: callbackId,
      pluginId: pluginId,
      eventName: eventName,
      listener: listener,
    });
    return dotnet
      .invokeMethodAsync(
        NAPACITOR_ASSEMBLY,
        'NAP_addListener',
        pluginId,
        eventName,
        callbackId,
      )
      .then(function () {
        return {
          remove: function () {
            return removeListenerById(callbackId);
          },
        };
      });
  }

  function removeAllListeners(pluginId) {
    var stale = [];
    listeners.forEach(function (entry) {
      if (entry.pluginId === pluginId) {
        stale.push(entry.callbackId);
      }
    });
    for (var i = 0; i < stale.length; i++) {
      listeners.delete(stale[i]);
    }
    var dotnet = getDotNet();
    if (!dotnet || typeof dotnet.invokeMethodAsync !== 'function') {
      return Promise.resolve();
    }
    return dotnet.invokeMethodAsync(
      NAPACITOR_ASSEMBLY,
      'NAP_removeAllListeners',
      pluginId,
    );
  }

  /**
   * C# → JS 事件分发入口。native-bridge 尚未加载时,由 C# 注入的初始化桩
   * 将事件排入 NapacitorNative.__pending,此处安装真实现并回放队列。
   */
  function emit(callbackId, dataJson) {
    var entry = listeners.get(callbackId);
    if (!entry) {
      return;
    }
    var data = null;
    try {
      data = dataJson ? JSON.parse(dataJson) : null;
    } catch (e) {
      data = dataJson;
    }
    entry.listener(data);
  }

  function bindNativeBridge() {
    var info = getNativeInfo();
    if (!info) {
      return;
    }
    info.__emit = emit;
    info.__fetchText = function (url) {
      try {
        return fetch(url).then(function (res) {
          if (!res.ok) {
            return null;
          }
          return res.text();
        }, function () {
          return null;
        });
      } catch (e) {
        return Promise.resolve(null);
      }
    };
    // 回放加载前到达的事件
    var pending = info.__pending;
    if (pending && pending.length > 0) {
      var queued = pending.splice(0, pending.length);
      for (var i = 0; i < queued.length; i++) {
        emit(queued[i].callbackId, queued[i].dataJson);
      }
    }
  }

  function isNativePlatform() {
    return getNativeInfo() !== undefined;
  }

  function getPlatform() {
    var info = getNativeInfo();
    return info ? info.platform : 'web';
  }

  function isPluginAvailable(name) {
    var info = getNativeInfo();
    if (!info) {
      return false;
    }
    return info.plugins.indexOf(name) >= 0;
  }

  function convertFileUri(uri) {
    // Napacitor 0.1:WebView 与原生同源,直接返回原 URI。
    return uri;
  }

  /**
   * 注册插件(原生形态)。返回 Proxy:未知属性按需生成
   * “调用 NAP_invoke(pluginId, 方法名, 首参)” 的函数。
   */
  function registerPlugin(name) {
    var plugin = {
      addListener: function (eventName, listener) {
        return addListener(name, eventName, listener);
      },
      removeListener: function (eventName, listener) {
        var stale = [];
        listeners.forEach(function (entry) {
          if (entry.pluginId === name && entry.eventName === eventName) {
            stale.push(entry.callbackId);
          }
        });
        var chain = Promise.resolve();
        stale.forEach(function (callbackId) {
          chain = chain.then(function () {
            return removeListenerById(callbackId);
          });
        });
        return chain;
      },
      removeAllListeners: function () {
        return removeAllListeners(name);
      },
    };

    function callFactory(method) {
      return function () {
        var options = arguments.length > 0 ? arguments[0] : null;
        if (typeof options !== 'object' || options === null) {
          options = {};
        }
        return invoke(name, method, options);
      };
    }

    if (typeof Proxy === 'function') {
      return new Proxy(plugin, {
        get: function (target, prop) {
          if (typeof prop !== 'string') {
            return undefined;
          }
          if (prop in target) {
            return target[prop];
          }
          return callFactory(prop);
        },
      });
    }
    return plugin;
  }

  var NapacitorGlobalObject = {
    isNativePlatform: isNativePlatform,
    getPlatform: getPlatform,
    isPluginAvailable: isPluginAvailable,
    convertFileUri: convertFileUri,
    registerPlugin: registerPlugin,
    version: '0.1.0',
  };

  bindNativeBridge();

  // 安装全局对象(window 与 globalThis 双写,覆盖各平台 WebView 差异)
  window.Napacitor = NapacitorGlobalObject;
  globalThis['Napacitor'] = NapacitorGlobalObject;
})();
