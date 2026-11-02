/**
 * Security 调试页:set / get / remove / clear。
 */
function security() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Security');
}

function requireKey() {
  var key = document.getElementById('in-key').value.trim();
  if (!key) { alert('键不能为空'); return null; }
  return key;
}

document.getElementById('btn-set').addEventListener('click', async function () {
  var plugin = security(); if (!plugin) return;
  var key = requireKey(); if (!key) return;
  try {
    var value = document.getElementById('in-value').value;
    await plugin.set({ key: key, value: value });
    alert('已写入\nkey = ' + key + '\nvalue = ' + value);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-get').addEventListener('click', async function () {
  var plugin = security(); if (!plugin) return;
  var key = requireKey(); if (!key) return;
  try {
    var result = await plugin.get({ key: key });
    // GetResult 只有 value、不含 key,故把查询用的 key 一并显示
    alert('key = ' + key + '\n' + JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-remove').addEventListener('click', async function () {
  var plugin = security(); if (!plugin) return;
  var key = requireKey(); if (!key) return;
  try {
    await plugin.remove({ key: key });
    alert('已删除 ' + key);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-clear').addEventListener('click', async function () {
  var plugin = security(); if (!plugin) return;
  try {
    await plugin.clear();
    alert('已清空全部安全存储值');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
