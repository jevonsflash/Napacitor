/**
 * Display 调试页:getInfo / setKeepAwake / lock / unlock / displayChange 监听。
 */
var handle = null;

function display() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Display');
}

document.getElementById('btn-info').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    var info = await plugin.getInfo();
    alert(JSON.stringify(info, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-listen').addEventListener('click', async function () {
  var btn = document.getElementById('btn-listen');
  var plugin = display(); if (!plugin) return;
  try {
    if (handle) {
      await handle.remove();
      handle = null;
      btn.textContent = '开始监听 displayChange';
      alert('已停止监听');
      return;
    }
    handle = await plugin.addListener('displayChange', function (info) {
      alert('屏幕变化\n' + JSON.stringify(info, null, 2));
    });
    btn.textContent = '停止监听';
    alert('已开始监听 displayChange,屏幕指标变化时弹窗提醒');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-awake-on').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    await plugin.setKeepAwake({ keepAwake: true });
    alert('已开启屏幕常亮');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-awake-off').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    await plugin.setKeepAwake({ keepAwake: false });
    alert('已关闭屏幕常亮');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-lock-p').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    await plugin.lock({ orientation: 'portrait' });
    alert('已锁定竖屏');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-lock-l').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    await plugin.lock({ orientation: 'landscape' });
    alert('已锁定横屏');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-unlock').addEventListener('click', async function () {
  var plugin = display(); if (!plugin) return;
  try {
    await plugin.unlock();
    alert('已解锁方向,回落到全局设置');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
