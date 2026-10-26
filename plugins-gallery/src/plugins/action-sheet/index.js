/**
 * ActionSheet 调试页:showActions。
 */
document.getElementById('btn-show').addEventListener('click', async function () {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return; }
  var titles = document.getElementById('in-options').value
    .split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (titles.length === 0) { alert('至少需要一个选项'); return; }
  try {
    var result = await napacitor.registerPlugin('ActionSheet').showActions({
      title: document.getElementById('in-title').value,
      options: titles.map(function (title) { return { title: title }; }),
      cancelable: document.getElementById('in-cancelable').checked,
    });
    document.getElementById('output').textContent =
      result.canceled ? '已取消(index=-1)' : '选择了第 ' + result.index + ' 项:' + titles[result.index];
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
