/**
 * Connectivity 调试页:网络状态 / 互联网检测 / connectivityChange 事件监听。
 */
var handle = null;

document.getElementById('btn-status').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var status = await napacitor.registerPlugin('Connectivity').getStatus();
    alert(JSON.stringify(status, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-has').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var has = await napacitor.registerPlugin('Connectivity').hasInternetAccess();
    alert(JSON.stringify(has, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-listen').addEventListener('click', async function () {
  var btn = document.getElementById('btn-listen');
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    if (handle) {
      await handle.remove();
      handle = null;
      btn.textContent = '开始监听';
      alert('已停止监听');
      return;
    }
    handle = await napacitor.registerPlugin('Connectivity').addListener('connectivityChange', function (status) {
      alert(status.isConnected ? '网络已连接:' + status.connectionType : '网络已断开');
    });
    btn.textContent = '停止监听';
    alert('已开始监听 connectivityChange,变化时弹窗提醒');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
