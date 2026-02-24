import Database from 'better-sqlite3';
import fs from 'fs';

const backupData = JSON.parse(fs.readFileSync('../local_data_v4_20260224_103529.json', 'utf-8'));
const productTasks = backupData.productTasks;

const db = new Database('gantt.db');

// 清空现有的产品任务
console.log('清空现有产品任务...');
db.prepare('DELETE FROM tasks WHERE view = \'product\'').run();

// 导入产品任务
console.log('开始导入产品任务...');
const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, text, type, parent, start_date, end_date, duration, progress,
    status, owner, phase, priority, is_milestone, description,
    color, readonly, open, view, "order"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let successCount = 0;
productTasks.forEach(task => {
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

// 验证顺序
const modules = db.prepare('SELECT id, text, "order" FROM tasks WHERE type = \'project\' AND view = \'product\' ORDER BY "order"').all();
console.log('\n验证产品甘特图模块顺序:');
modules.forEach((m, idx) => {
  console.log(`  ${idx + 1}. ${m.text}`);
});

// 查看智能问数助手的任务
console.log('\n智能问数助手任务:');
const intelligentQueryTasks = db.prepare('SELECT id, text, "order" FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
intelligentQueryTasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id})`);
});

db.close();
