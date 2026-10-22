/**
 * App Info 调试页:应用信息 / 版本跟踪 / 打开系统设置。
 */
document.getElementById('btn-info').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var info = await napacitor.registerPlugin('AppInfo').getInfo();
    alert(JSON.stringify(info, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-track').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var tracking = await napacitor.registerPlugin('AppInfo').getVersionTracking();
    alert(JSON.stringify(tracking, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-settings').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('AppInfo').openSettings();
    alert('已请求打开系统应用设置页');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
