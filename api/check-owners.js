import Database from 'better-sqlite3';

const db = new Database('gantt.db');

// 查看智能问数助手任务的负责人
console.log('=== 智能问数助手任务负责人 ===');
const tasks = db.prepare('SELECT id, text, owner FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
tasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text}: ${t.owner || '(无)'}`);
});

db.close();
