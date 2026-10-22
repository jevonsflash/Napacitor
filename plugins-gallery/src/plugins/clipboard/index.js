/**
 * Clipboard 调试页:写入 / 读取剪贴板文本。
 */
document.getElementById('btn-write').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var text = document.getElementById('in-text').value;
    await napacitor.registerPlugin('Clipboard').write({ string: text });
    alert('已写入剪贴板:' + text);
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-read').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  try {
    var result = await napacitor.registerPlugin('Clipboard').read();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
