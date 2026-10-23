/**
 * Core APIs 调试页:平台工具 + console 转发 + 原生主动事件(TriggerJSEventAsync)。
 */
function napacitor() {
  // 原生桥注入在顶层文档,iframe 内经 window.parent 取用
  return window.parent.Napacitor;
}

// ---- 平台与环境 ----
document.getElementById('btn-env').addEventListener('click', function () {
  var n = napacitor();
  var out = document.getElementById('env-out');
  if (!n) {
    out.textContent = '未检测到 Napacitor(应在 MAUI 宿主中运行)';
    return;
  }
  var names = ['Device', 'Battery', 'Clipboard', 'Connectivity', 'Haptics',
    'Motion', 'Share', 'Camera'];
  var available = {};
  names.forEach(function (name) { available[name] = n.isPluginAvailable(name); });
  out.textContent = JSON.stringify({
    platform: n.getPlatform(),
    isNativePlatform: n.isNativePlatform(),
    version: n.version,
    convertFileUri: n.convertFileUri('assets/demo.json'),
    isPluginAvailable: available,
  }, null, 2);
});

// ---- console 转发(loggingBehavior)----
document.getElementById('btn-log').addEventListener('click', function () {
  console.log('[Core APIs 测试] console.log —— 应出现在 IDE 诊断输出');
});
document.getElementById('btn-warn').addEventListener('click', function () {
  console.warn('[Core APIs 测试] console.warn —— 原生日志级别 warn');
});
document.getElementById('btn-error').addEventListener('click', function () {
  console.error('[Core APIs 测试] console.error —— 原生日志级别 error');
});

// ---- 原生主动事件(TriggerJSEventAsync):派发在顶层 window ----
var listening = false;

document.getElementById('btn-listen').addEventListener('click', function (e) {
  var btn = e.currentTarget;
  if (listening) {
    listening = false;
    btn.textContent = '开始监听';
    logEvent('已停止监听');
    return;
  }
  listening = true;
  btn.textContent = '停止监听';
  logEvent('已开始监听 napacitor:tick / napacitor:asset …');
});

function logEvent(text) {
  var out = document.getElementById('event-out');
  var line = new Date().toLocaleTimeString() + '  ' + text;
  out.textContent = line + '\n' + (out.textContent || '');
}

['napacitor:tick', 'napacitor:asset'].forEach(function (name) {
  window.parent.addEventListener(name, function (e) {
    // 经顶层 window 的 console 转发回原生(iframe 自身的 console 未打转发补丁)
    try { window.parent.console.log('[napacitor:event] ' + name); } catch {}
    if (!listening) { return; }
    var detail = e.detail === undefined ? '' : ' ' + JSON.stringify(e.detail);
    logEvent(name + detail);
  });
});
