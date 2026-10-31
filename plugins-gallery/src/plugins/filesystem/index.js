/**
 * Filesystem 调试页:getDirectoryPaths / readBundleFile / copyBundleFile / pickFile / pickFiles。
 */
function fs() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Filesystem');
}

function show(text) {
  document.getElementById('output').textContent = text;
}

// base64 内容可能非常大,展示前截断
function brief(value) {
  var json = JSON.stringify(value, null, 2);
  if (json.length > 1500) { return json.slice(0, 1500) + '\n…(已截断,总长 ' + json.length + ' 字符)'; }
  return json;
}

document.getElementById('btn-paths').addEventListener('click', async function () {
  var plugin = fs(); if (!plugin) return;
  try {
    var paths = await plugin.getDirectoryPaths();
    show('目录路径:\n' + JSON.stringify(paths, null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-read').addEventListener('click', async function () {
  var plugin = fs(); if (!plugin) return;
  var path = document.getElementById('in-bundle-path').value.trim();
  if (!path) { alert('请输入包内资源路径(Resources/Raw 下)'); return; }
  try {
    var result = await plugin.readBundleFile({ path: path });
    show(path + ' 内容(截断至 800 字符):\n' + result.data.slice(0, 800));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-copy').addEventListener('click', async function () {
  var plugin = fs(); if (!plugin) return;
  var path = document.getElementById('in-bundle-path').value.trim();
  if (!path) { alert('请输入包内资源路径(Resources/Raw 下)'); return; }
  try {
    var options = {
      path: path,
      targetDirectory: document.getElementById('in-target').value,
    };
    var fileName = document.getElementById('in-file-name').value.trim();
    if (fileName) { options.fileName = fileName; }
    var result = await plugin.copyBundleFile(options);
    show('已复制到:' + result.path);
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

function pickOptions() {
  var types = document.getElementById('in-types').value;
  return types === 'any' ? {} : { types: types };
}

document.getElementById('btn-pick').addEventListener('click', async function () {
  var plugin = fs(); if (!plugin) return;
  try {
    var file = await plugin.pickFile(pickOptions());
    if (!file) { show('已取消选择'); return; }
    show('选取结果:\n' + brief(file));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-picks').addEventListener('click', async function () {
  var plugin = fs(); if (!plugin) return;
  try {
    var files = await plugin.pickFiles(pickOptions());
    if (!files.length) { show('已取消选择(或未选中任何文件)'); return; }
    show('共选取 ' + files.length + ' 个文件:\n' + brief(files));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
