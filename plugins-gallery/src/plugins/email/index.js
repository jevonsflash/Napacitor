/**
 * Email 调试页:检测支持 / 唤起系统邮件客户端。
 */
document.getElementById('btn-can').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('Email').isSupported();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-compose').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    await napacitor.registerPlugin('Email').compose({
      to: document.getElementById('in-to').value.split(/[,，]/)
        .map(function (s) { return s.trim(); })
        .filter(Boolean),
      subject: document.getElementById('in-subject').value,
      body: document.getElementById('in-body').value,
    });
    alert('邮件编写窗口已唤起');
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
