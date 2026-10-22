/**
 * Share 调试页:检测支持 / 弹出系统分享面板。
 */
document.getElementById('btn-can').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var check = await napacitor.registerPlugin('Share').canShare();
    alert(JSON.stringify(check, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-share').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var share = napacitor.registerPlugin('Share');
    var check = await share.canShare();
    if (!check.canShare) {
      alert('当前平台不支持分享');
      return;
    }
    await share.share({
      title: document.getElementById('in-title').value,
      text: document.getElementById('in-text').value,
      url: document.getElementById('in-url').value,
      dialogTitle: '分享到…',
    });
    alert('分享面板已弹出');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
