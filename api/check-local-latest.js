import Database from 'better-sqlite3';

const db = new Database('gantt.db');

// 智能问数助手任务
console.log('=== 智能问数助手任务 ===');
const iqTasks = db.prepare('SELECT id, text, start_date, end_date, owner FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
iqTasks.forEach((t, i) => {
  const start = t.start_date ? t.start_date.substring(0, 10) : 'N/A';
  const end = t.end_date ? t.end_date.substring(0, 10) : 'N/A';
  console.log(`${i + 1}. ${t.text} | ${start} ~ ${end} | 负责人: ${t.owner || '(无)'}`);
});

// 订单进度查询任务
console.log('\n=== 订单进度查询任务 ===');
const orderTasks = db.prepare('SELECT id, text, type FROM tasks WHERE parent = \'module-12-product\' ORDER BY "order"').all();
orderTasks.forEach((t, i) => {
  console.log(`${i + 1}. ${t.text} (id: ${t.id}, type: ${t.type})`);
});

// 产品甘特图所有模块
console.log('\n=== 产品甘特图所有模块 ===');
const modules = db.prepare('SELECT id, text, "order" FROM tasks WHERE type = \'project\' AND view = \'product\' ORDER BY "order"').all();
modules.forEach((m, i) => {
  console.log(`${i + 1}. ${m.text}`);
});

db.close();
