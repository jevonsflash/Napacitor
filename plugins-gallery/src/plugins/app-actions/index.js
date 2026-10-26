/**
 * AppActions 调试页:isSupported / set / get / appActionPerformed 监听。
 */
var listenHandle = null;

function appActions() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('AppActions');
}

function show(text) {
  document.getElementById('output').textContent = text;
}

function parseActions() {
  return document.getElementById('in-actions').value
    .split('\n')
    .map(function (line) { return line.trim(); })
    .filter(Boolean)
    .map(function (line) {
      var parts = line.split('|').map(function (s) { return s.trim(); });
      var action = { id: parts[0], title: parts[1] || parts[0] };
      if (parts[2]) { action.subtitle = parts[2]; }
      return action;
    });
}

document.getElementById('btn-supported').addEventListener('click', async function () {
  var plugin = appActions(); if (!plugin) return;
  try {
    var result = await plugin.isSupported();
    show('isSupported() → ' + JSON.stringify(result));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-set').addEventListener('click', async function () {
  var plugin = appActions(); if (!plugin) return;
  var actions = parseActions();
  if (actions.length === 0) { show('至少需要一个快捷方式'); return; }
  try {
    await plugin.set({ actions: actions });
    show('已设置 ' + actions.length + ' 个快捷方式(长按 / 右键应用图标查看)');
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-get').addEventListener('click', async function () {
  var plugin = appActions(); if (!plugin) return;
  try {
    var result = await plugin.get();
    show('get() → ' + JSON.stringify(result.actions, null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-listen').addEventListener('click', async function () {
  var btn = document.getElementById('btn-listen');
  var plugin = appActions(); if (!plugin) return;
  try {
    if (listenHandle) {
      await listenHandle.remove();
      listenHandle = null;
      btn.textContent = '监听点击事件';
      show('已停止监听');
      return;
    }
    listenHandle = await plugin.addListener('appActionPerformed', function (event) {
      show('appActionPerformed → ' + JSON.stringify(event.action));
    });
    btn.textContent = '停止监听';
    show('已开始监听 appActionPerformed(需宿主转发,见提示)');
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
