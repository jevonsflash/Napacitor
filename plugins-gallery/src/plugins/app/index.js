/**
 * App 调试页:getState / getAppLanguage / getLaunchUrl / 生命周期监听 / exitApp。
 */
var handles = [];

function app() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('App');
}

function log(text) {
  var output = document.getElementById('output');
  var line = new Date().toLocaleTimeString() + ' ' + text;
  output.textContent = line + '\n' + (output.textContent.split('\n').slice(0, 19).join('\n'));
}

document.getElementById('btn-state').addEventListener('click', async function () {
  var plugin = app(); if (!plugin) return;
  try { log('getState() → ' + JSON.stringify(await plugin.getState())); }
  catch (err) { log('出错:' + (err && err.message || err)); }
});

document.getElementById('btn-language').addEventListener('click', async function () {
  var plugin = app(); if (!plugin) return;
  try { log('getAppLanguage() → ' + JSON.stringify(await plugin.getAppLanguage())); }
  catch (err) { log('出错:' + (err && err.message || err)); }
});

document.getElementById('btn-launch').addEventListener('click', async function () {
  var plugin = app(); if (!plugin) return;
  try {
    var result = await plugin.getLaunchUrl();
    log('getLaunchUrl() → ' + JSON.stringify(result) + (result.url ? '' : '(未收到过深链)'));
  } catch (err) {
    log('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-listen').addEventListener('click', async function () {
  var btn = document.getElementById('btn-listen');
  var plugin = app(); if (!plugin) return;
  try {
    if (handles.length > 0) {
      for (var i = 0; i < handles.length; i++) { await handles[i].remove(); }
      handles = [];
      btn.textContent = '开始监听生命周期';
      log('已停止监听');
      return;
    }
    handles.push(await plugin.addListener('appStateChange', function (state) {
      log('appStateChange → ' + JSON.stringify(state));
    }));
    handles.push(await plugin.addListener('pause', function () {
      log('pause');
    }));
    handles.push(await plugin.addListener('resume', function () {
      log('resume');
    }));
    btn.textContent = '停止监听';
    log('已开始监听 appStateChange / pause / resume');
  } catch (err) {
    log('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-exit').addEventListener('click', async function () {
  var plugin = app(); if (!plugin) return;
  if (!window.confirm('确定要退出应用吗?(Windows/macOS 有效)')) return;
  try {
    await plugin.exitApp();
    log('exitApp() 已调用');
  } catch (err) {
    log('出错:' + (err && err.message || err));
  }
});
