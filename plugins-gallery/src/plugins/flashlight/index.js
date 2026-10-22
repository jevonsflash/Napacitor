/**
 * Flashlight 调试页:支持检测 / 开 / 关 / 切换 / 状态查询。
 */
var intensity = document.getElementById('in-intensity');
intensity.addEventListener('input', function () {
  document.getElementById('intensity-val').textContent = intensity.value;
});

document.getElementById('btn-check').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('Flashlight').isSupported();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-on').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('Flashlight').switchOn({ intensity: Number(intensity.value) });
    alert('手电筒已打开(亮度 ' + intensity.value + ')');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-off').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('Flashlight').switchOff();
    alert('手电筒已关闭');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-toggle').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var flashlight = napacitor.registerPlugin('Flashlight');
    await flashlight.toggle({ intensity: Number(intensity.value) });
    var state = await flashlight.getState();
    alert(JSON.stringify(state, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-state').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var state = await napacitor.registerPlugin('Flashlight').getState();
    alert(JSON.stringify(state, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
