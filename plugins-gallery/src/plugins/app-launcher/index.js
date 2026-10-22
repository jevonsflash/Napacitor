/**
 * App Launcher 调试页:URL / 应用检测与打开、地图定位。
 */
document.getElementById('btn-can-url').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('AppLauncher').canOpenUrl({
      url: document.getElementById('in-url').value.trim(),
    });
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-open-url').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var url = document.getElementById('in-url').value.trim();
    await napacitor.registerPlugin('AppLauncher').openUrl({ url: url });
    alert('已请求打开:' + url);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-can-app').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('AppLauncher').canOpenApp({
      appId: document.getElementById('in-appid').value.trim(),
    });
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-open-app').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var appId = document.getElementById('in-appid').value.trim();
    await napacitor.registerPlugin('AppLauncher').openApp({ appId: appId });
    alert('已请求打开应用:' + appId);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-map').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var lat = Number(document.getElementById('in-lat').value);
    var lng = Number(document.getElementById('in-lng').value);
    await napacitor.registerPlugin('AppLauncher').openMap({
      latitude: lat,
      longitude: lng,
      label: document.getElementById('in-label').value,
    });
    alert('已请求打开地图定位:' + lat + ', ' + lng);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
