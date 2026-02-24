import Database from 'better-sqlite3';
import fs from 'fs';

// 从前端导出的localStorage数据文件
const localStorageFile = process.argv[2] || '../localstorage-export.json';

console.log('读取localStorage文件:', localStorageFile);
const data = JSON.parse(fs.readFileSync(localStorageFile, 'utf-8'));

const db = new Database('gantt.db');

// 清空现有的产品任务
console.log('\n清空现有产品任务...');
db.prepare('DELETE FROM tasks WHERE view = \'product\'').run();

// 导入产品任务
console.log('开始导入产品任务（来自前端localStorage）...');
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
const intelligentQueryTasks = db.prepare('SELECT id, text, "order", owner FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
intelligentQueryTasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id}, owner: ${t.owner || '(无)'})`);
});

db.close();
