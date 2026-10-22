/**
 * Battery 调试页:读取电池信息 + batteryStatusChange 事件监听。
 */
var handle = null;

document.getElementById('btn-info').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var info = await napacitor.registerPlugin('Battery').getBatteryInfo();
    alert(JSON.stringify(info, null, 2));
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
    handle = await napacitor.registerPlugin('Battery').addListener('batteryStatusChange', function (info) {
      alert('电量 ' + Math.round(info.batteryLevel * 100) + '%' + (info.isCharging ? ',充电中' : ''));
    });
    btn.textContent = '停止监听';
    alert('已开始监听 batteryStatusChange,变化时弹窗提醒');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
