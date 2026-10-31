/**
 * Camera 调试页:isCaptureSupported / pickPhotos / pickVideos / capturePhoto / captureVideo。
 */
function cam() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Camera');
}

function options() {
  var opts = {
    selectionLimit: Number(document.getElementById('in-limit').value) || 0,
    compressionQuality: Number(document.getElementById('in-quality').value) || 100,
    rotateImage: document.getElementById('in-rotate').checked,
  };
  var maxw = Number(document.getElementById('in-maxw').value);
  var maxh = Number(document.getElementById('in-maxh').value);
  if (maxw > 0) { opts.maximumWidth = maxw; }
  if (maxh > 0) { opts.maximumHeight = maxh; }
  if (document.getElementById('in-meta').checked) { opts.preserveMetaData = true; }
  return opts;
}

function show(text) {
  document.getElementById('output').textContent = text;
}

// 只保留 meta 字段,base64 单独预览/截断
function meta(file) {
  return {
    name: file.name,
    path: file.path,
    size: file.size,
    contentType: file.contentType,
    dataLength: file.data ? file.data.length : 0,
  };
}

function preview(files) {
  var img = document.getElementById('preview');
  var image = files.find(function (f) { return (f.contentType || '').indexOf('image/') === 0; });
  if (image) {
    img.src = 'data:' + image.contentType + ';base64,' + image.data;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }
}

document.getElementById('btn-supported').addEventListener('click', async function () {
  var plugin = cam(); if (!plugin) return;
  try {
    var supported = await plugin.isCaptureSupported();
    show('支持拍照/录像:' + supported);
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-photos').addEventListener('click', async function () {
  var plugin = cam(); if (!plugin) return;
  try {
    var files = await plugin.pickPhotos(options());
    if (!files.length) { show('已取消选择(或未选中任何照片)'); return; }
    preview(files);
    show('共选取 ' + files.length + ' 张照片:\n' + JSON.stringify(files.map(meta), null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-videos').addEventListener('click', async function () {
  var plugin = cam(); if (!plugin) return;
  try {
    var files = await plugin.pickVideos(options());
    if (!files.length) { show('已取消选择(或未选中任何视频)'); return; }
    preview(files);
    show('共选取 ' + files.length + ' 个视频:\n' + JSON.stringify(files.map(meta), null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-photo').addEventListener('click', async function () {
  var plugin = cam(); if (!plugin) return;
  try {
    var file = await plugin.capturePhoto(options());
    if (!file) { show('已取消拍摄'); return; }
    preview([file]);
    show('拍摄结果:\n' + JSON.stringify(meta(file), null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-video').addEventListener('click', async function () {
  var plugin = cam(); if (!plugin) return;
  try {
    var file = await plugin.captureVideo(options());
    if (!file) { show('已取消拍摄'); return; }
    preview([file]);
    show('拍摄结果:\n' + JSON.stringify(meta(file), null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
