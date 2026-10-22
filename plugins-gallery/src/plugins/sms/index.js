/**
 * Sms 调试页:检测支持 / 唤起系统短信客户端。
 */
document.getElementById('btn-can').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('Sms').isSupported();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-send').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var body = document.getElementById('in-body').value;
    await napacitor.registerPlugin('Sms').send({
      recipients: document.getElementById('in-to').value.split(/[,，]/)
        .map(function (s) { return s.trim(); })
        .filter(Boolean),
      body: body || undefined,
    });
    alert('短信编写窗口已唤起');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
