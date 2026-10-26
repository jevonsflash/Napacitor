/**
 * Dialog 调试页:alert / confirm / prompt。
 */
function dialog() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Dialog');
}

function baseOptions() {
  return {
    title: document.getElementById('in-title').value,
    message: document.getElementById('in-message').value,
  };
}

function show(text) {
  document.getElementById('output').textContent = text;
}

document.getElementById('btn-alert').addEventListener('click', async function () {
  var plugin = dialog(); if (!plugin) return;
  try {
    await plugin.alert(baseOptions());
    show('alert() 已关闭');
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-confirm').addEventListener('click', async function () {
  var plugin = dialog(); if (!plugin) return;
  try {
    var result = await plugin.confirm(baseOptions());
    show('confirm() → ' + JSON.stringify(result));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-prompt').addEventListener('click', async function () {
  var plugin = dialog(); if (!plugin) return;
  try {
    var options = baseOptions();
    var placeholder = document.getElementById('in-placeholder').value.trim();
    if (placeholder) { options.inputPlaceholder = placeholder; }
    var result = await plugin.prompt(options);
    show('prompt() → ' + JSON.stringify(result));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
