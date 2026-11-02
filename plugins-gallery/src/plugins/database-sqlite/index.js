/**
 * DatabaseSqlite 调试页:execute / query / getDatabaseList / deleteDatabase。
 */
function db() {
  var napacitor = window.parent.Napacitor;
  if (!napacitor) { alert('未检测到原生桥,请在 MAUI 宿主中运行'); return null; }
  return napacitor.registerPlugin('DatabaseSqlite');
}

function dbOptions() {
  var database = document.getElementById('in-db').value.trim();
  return database ? { database: database } : {};
}

function requireSql() {
  var sql = document.getElementById('in-sql').value.trim();
  if (!sql) { alert('SQL 不能为空'); return null; }
  return sql;
}

document.getElementById('btn-execute').addEventListener('click', async function () {
  var plugin = db(); if (!plugin) return;
  var sql = requireSql(); if (!sql) return;
  try {
    var opts = dbOptions();
    opts.statements = sql;
    opts.transaction = true;
    var result = await plugin.execute(opts);
    alert('执行成功\n' + JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-query').addEventListener('click', async function () {
  var plugin = db(); if (!plugin) return;
  var sql = requireSql(); if (!sql) return;
  try {
    var opts = dbOptions();
    opts.statement = sql;
    var result = await plugin.query(opts);
    alert('查询到 ' + result.values.length + ' 行\n' + JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-list').addEventListener('click', async function () {
  var plugin = db(); if (!plugin) return;
  try {
    var result = await plugin.getDatabaseList();
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});

document.getElementById('btn-delete').addEventListener('click', async function () {
  var plugin = db(); if (!plugin) return;
  try {
    var result = await plugin.deleteDatabase(dbOptions());
    alert(JSON.stringify(result, null, 2));
  } catch (err) {
    alert('出错:' + (err && err.message || err));
  }
});
