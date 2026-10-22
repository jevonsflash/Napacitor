/**
 * Phone Dialer 调试页:检测支持 / 打开拨号界面。
 */
document.getElementById('btn-can').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('PhoneDialer').isSupported();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-open').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var number = document.getElementById('in-number').value.trim();
    await napacitor.registerPlugin('PhoneDialer').open({ number: number });
    alert('拨号界面已打开:' + number);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
