/**
 * Device 调试页:获取设备信息 / 语言代码 / 区域设置。
 */
document.getElementById('btn-info').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var info = await napacitor.registerPlugin('Device').getInfo();
    alert(JSON.stringify(info, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-lang').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var lang = await napacitor.registerPlugin('Device').getLanguageCode();
    alert(JSON.stringify(lang, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-locale').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var locale = await napacitor.registerPlugin('Device').getLocale();
    alert(JSON.stringify(locale, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
