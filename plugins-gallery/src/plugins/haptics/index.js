/**
 * Haptics 调试页:振动 / 冲击 / 通知触觉 / 选择轻触。
 */
var duration = document.getElementById('in-duration');
duration.addEventListener('input', function () {
  document.getElementById('duration-val').textContent = duration.value + 'ms';
});

document.getElementById('btn-vibrate').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('Haptics').vibrate({ duration: Number(duration.value) });
    alert('已触发振动 ' + duration.value + 'ms');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-impact').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var style = document.getElementById('in-impact').value;
    await napacitor.registerPlugin('Haptics').impact({ style: style });
    alert('已触发冲击触觉:' + style);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-notify').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var type = document.getElementById('in-notify').value;
    await napacitor.registerPlugin('Haptics').notification({ type: type });
    alert('已触发通知触觉:' + type);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-select').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('Haptics').selection();
    alert('已触发选择轻触');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
