/**
 * Geolocation 调试页:权限 / 一次性定位 / 持续监听。
 * 注意:本页直接走 registerPlugin 原生代理,因此监听使用底层的
 * position / error 事件 + watchPosition(options) → { id } 形态
 * (npm 包 @napacitor/geolocation 在此之上封装为回调式 API)。
 */
var watchId = null;
var posHandle = null;
var errHandle = null;

function geo() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Geolocation');
}

function options() {
  return {
    enableHighAccuracy: document.getElementById('in-accuracy').checked,
    timeout: Number(document.getElementById('in-timeout').value) || 10000,
  };
}

function show(text) {
  document.getElementById('output').textContent = text;
}

function fmt(position) {
  var c = position.coords;
  return new Date(position.timestamp).toLocaleTimeString() +
    ' 纬度 ' + c.latitude.toFixed(6) + ' / 经度 ' + c.longitude.toFixed(6) +
    ' / 精度 ±' + c.accuracy.toFixed(0) + 'm' +
    (c.speed != null ? ' / 速度 ' + c.speed.toFixed(1) + 'm/s' : '');
}

document.getElementById('btn-check').addEventListener('click', async function () {
  var plugin = geo(); if (!plugin) return;
  try { show('权限状态:' + JSON.stringify(await plugin.checkPermissions())); }
  catch (err) { show('出错:' + (err && err.message || err)); }
});

document.getElementById('btn-request').addEventListener('click', async function () {
  var plugin = geo(); if (!plugin) return;
  try { show('权限状态(请求后):' + JSON.stringify(await plugin.requestPermissions())); }
  catch (err) { show('出错:' + (err && err.message || err)); }
});

document.getElementById('btn-current').addEventListener('click', async function () {
  var plugin = geo(); if (!plugin) return;
  show('定位中…');
  try {
    var position = await plugin.getCurrentPosition(options());
    show('当前位置:' + fmt(position));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-watch').addEventListener('click', async function () {
  var plugin = geo(); if (!plugin) return;
  if (watchId !== null) { show('已在监听中,请先停止'); return; }
  try {
    posHandle = await plugin.addListener('position', function (position) {
      show('监听中:' + fmt(position));
    });
    errHandle = await plugin.addListener('error', function (err) {
      show('监听出错:' + (err && err.code) + ' ' + (err && err.message));
    });
    var result = await plugin.watchPosition(options());
    watchId = result.id;
    show('已开始监听(watchId=' + watchId + '),位置更新将显示在这里');
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-stop').addEventListener('click', async function () {
  var plugin = geo(); if (!plugin) return;
  if (watchId === null) { show('当前没有监听'); return; }
  try {
    await plugin.clearWatch({ id: watchId });
    if (posHandle) { await posHandle.remove(); posHandle = null; }
    if (errHandle) { await errHandle.remove(); errHandle = null; }
    watchId = null;
    show('已停止监听');
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
