import Database from 'better-sqlite3';

const db = new Database('gantt.db');

// 验证智能问数助手的任务
console.log('=== 智能问数助手任务 ===');
const tasks = db.prepare('SELECT id, text, "order" FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
tasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id})`);
});

// 验证模块顺序
console.log('\n=== 产品甘特图模块顺序 ===');
const modules = db.prepare('SELECT id, text, "order" FROM tasks WHERE type = \'project\' AND view = \'product\' ORDER BY "order"').all();
modules.forEach((m, idx) => {
  console.log(`  ${idx + 1}. ${m.text}`);
});

db.close();
