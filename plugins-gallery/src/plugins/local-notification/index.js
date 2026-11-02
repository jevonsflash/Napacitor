/**
 * LocalNotification 调试页:requestPermission / schedule / cancel / notificationReceived 监听。
 */
var handle = null;
var lastId = null;

function ln() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('LocalNotification');
}

document.getElementById('btn-permission').addEventListener('click', async function () {
  var plugin = ln(); if (!plugin) return;
  try {
    var status = await plugin.requestPermission();
    alert(JSON.stringify(status, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-schedule').addEventListener('click', async function () {
  var plugin = ln(); if (!plugin) return;
  var title = document.getElementById('in-title').value.trim();
  var body = document.getElementById('in-body').value.trim();
  var at = document.getElementById('in-at').value.trim();
  if (!title) { alert('标题不能为空'); return; }
  try {
    var item = { title: title, body: body };
    if (at) { item.at = at; }
    var result = await plugin.schedule({ notifications: [item] });
    lastId = result.notifications[0].id;
    alert('已' + (at ? '排期' : '发送') + ',id = ' + lastId);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-cancel').addEventListener('click', async function () {
  var plugin = ln(); if (!plugin) return;
  if (lastId == null) { alert('请先发送一次通知以获取 id'); return; }
  try {
    await plugin.cancel({ notifications: [{ id: lastId }] });
    alert('已取消 id = ' + lastId);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-listen').addEventListener('click', async function () {
  var btn = document.getElementById('btn-listen');
  var plugin = ln(); if (!plugin) return;
  try {
    if (handle) {
      await handle.remove();
      handle = null;
      btn.textContent = '开始监听 notificationReceived';
      alert('已停止监听');
      return;
    }
    handle = await plugin.addListener('notificationReceived', function (payload) {
      alert('点击了通知\nid = ' + payload.id + '\n' + payload.title + '\n' + payload.body);
    });
    btn.textContent = '停止监听';
    alert('已开始监听 notificationReceived,点击通知后弹窗提示');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
