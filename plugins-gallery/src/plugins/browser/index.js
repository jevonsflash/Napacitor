/**
 * Browser 调试页:open / close。
 */
function browser() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Browser');
}

document.getElementById('btn-open').addEventListener('click', async function () {
  var plugin = browser(); if (!plugin) return;
  try {
    var url = document.getElementById('in-url').value.trim();
    var toolbarColor = document.getElementById('in-toolbar').value.trim();
    await plugin.open(toolbarColor ? { url: url, toolbarColor: toolbarColor } : { url: url });
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-close').addEventListener('click', async function () {
  var plugin = browser(); if (!plugin) return;
  try {
    await plugin.close();
    alert('浏览器已关闭');
  } catch (err) {
    alert('预期行为:close() 尚未实现\n\n' + (err && err.code ? 'code: ' + err.code + '\n' : '') +
      (err && err.message || err));
  }
});
