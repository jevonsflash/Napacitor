/**
 * Contacts 调试页:getContacts / pickContact。
 */
function contactsPlugin() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('Contacts');
}

function show(text) {
  document.getElementById('output').textContent = text;
}

// 单行摘要:显示名 + 第一个电话/邮箱
function line(c) {
  var phone = c.phones && c.phones.length ? c.phones[0].phoneNumber : '';
  var email = c.emails && c.emails.length ? c.emails[0].emailAddress : '';
  return '- ' + c.displayName + (phone ? ' / ' + phone : '') + (email ? ' / ' + email : '');
}

function limit() {
  return Math.max(1, Number(document.getElementById('in-limit').value) || 20);
}

document.getElementById('btn-all').addEventListener('click', async function () {
  var plugin = contactsPlugin(); if (!plugin) return;
  show('读取中…');
  try {
    var contacts = await plugin.getContacts();
    var head = contacts.slice(0, limit()).map(line).join('\n');
    var more = contacts.length > limit() ? '\n…(共 ' + contacts.length + ' 条,仅展示前 ' + limit() + ' 条)' : '';
    show('共 ' + contacts.length + ' 个联系人:\n' + head + more);
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-pick').addEventListener('click', async function () {
  var plugin = contactsPlugin(); if (!plugin) return;
  try {
    var picked = await plugin.pickContact();
    if (!picked) { show('已取消选择'); return; }
    show('选中的联系人:\n' + JSON.stringify(picked, null, 2));
  } catch (err) {
    show('出错:' + (err && err.message || err));
  }
});
