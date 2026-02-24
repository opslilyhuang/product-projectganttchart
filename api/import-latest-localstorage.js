import Database from 'better-sqlite3';
import fs from 'fs';

// 从最新的localStorage文件导入
const localStorageFile = '../localstorage-latest-20260224.json';
console.log('读取localStorage文件:', localStorageFile);
const data = JSON.parse(fs.readFileSync(localStorageFile, 'utf-8'));

const db = new Database('gantt.db');

// 清空现有的产品任务
console.log('\n清空现有产品任务...');
db.prepare('DELETE FROM tasks WHERE view = \'product\'').run();

// 导入产品任务
console.log('开始导入产品任务（来自最新localStorage）...');
const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, text, type, parent, start_date, end_date, duration, progress,
    status, owner, phase, priority, is_milestone, description,
    color, readonly, open, view, "order"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let successCount = 0;
data.productTasks.forEach(task => {
  try {
    insertTask.run(
      task.id,
      task.text,
      task.type,
      task.parent || null,
      task.start_date,
      task.end_date,
      task.duration,
      task.progress || 0,
      task.status || 'planned',
      task.owner || '',
      task.phase || 'H1',
      task.priority || 'medium',
      task.is_milestone ? 1 : 0,
      task.description || '',
      task.color || '',
      task.readonly ? 1 : 0,
      task.open ? 1 : 0,
      'product',
      task.order || 0
    );
    successCount++;
  } catch (err) {
    console.error('导入任务失败:', task.id, err.message);
  }
});

console.log(`✅ 成功导入 ${successCount} 个产品任务到数据库`);

// 验证智能问数助手的任务
console.log('\n智能问数助手任务:');
const intelligentQueryTasks = db.prepare('SELECT id, text, start_date, end_date, owner FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
intelligentQueryTasks.forEach((t, idx) => {
  const start = t.start_date ? t.start_date.substring(0, 10) : 'N/A';
  const end = t.end_date ? t.end_date.substring(0, 10) : 'N/A';
  console.log(`  ${idx + 1}. ${t.text} | ${start} ~ ${end} | 负责人: ${t.owner || '(无)'}`);
});

// 验证订单进度查询的任务
console.log('\n订单进度查询任务:');
const orderTasks = db.prepare('SELECT id, text FROM tasks WHERE parent = \'module-12-product\' ORDER BY "order"').all();
orderTasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id})`);
});

db.close();
