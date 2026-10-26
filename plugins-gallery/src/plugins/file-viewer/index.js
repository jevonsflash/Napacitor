/**
 * FileViewer 调试页:openDocumentFromLocalPath / Resources / Url。
 */
function viewer() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('FileViewer');
}

document.getElementById('btn-local').addEventListener('click', async function () {
  var plugin = viewer(); if (!plugin) return;
  var path = document.getElementById('in-path').value.trim();
  if (!path) { alert('请输入本地文件的绝对路径'); return; }
  try {
    await plugin.openDocumentFromLocalPath({ path: path });
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-resource').addEventListener('click', async function () {
  var plugin = viewer(); if (!plugin) return;
  var path = document.getElementById('in-resource').value.trim();
  if (!path) { alert('请输入包内资源路径(Resources/Raw 下)'); return; }
  try {
    await plugin.openDocumentFromResources({ path: path });
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-url').addEventListener('click', async function () {
  var plugin = viewer(); if (!plugin) return;
  var url = document.getElementById('in-url').value.trim();
  if (!url) { alert('请输入远程文件地址'); return; }
  try {
    await plugin.openDocumentFromUrl({ url: url });
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
