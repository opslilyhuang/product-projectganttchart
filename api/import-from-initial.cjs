const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const initialData = JSON.parse(fs.readFileSync(path.join(__dirname, '../frontend/src/data/initial-data.json'), 'utf8'));

const db = new Database(path.join(__dirname, 'gantt.db'));

db.prepare('DELETE FROM tasks').run();

const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, text, type, parent, start_date, end_date, duration,
    progress, owner, phase, is_milestone, description, view,
    priority, status, "order"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tasks = initialData.tasks;
console.log(`导入 ${tasks.length} 个任务...`);

tasks.forEach(task => {
  insertTask.run(
    task.id,
    task.text,
    task.type,
    task.parent || null,
    task.start_date,
    task.end_date,
    task.duration,
    task.progress || 0,
    task.owner || '',
    task.phase || '',
    task.is_milestone ? 1 : 0,
    task.description || '',
    task.view || 'project',
    task.priority || 'medium',
    task.status || 'planned',
    task.order || 0
  );
});

console.log('✅ 导入完成');

const verify = db.prepare('SELECT id, text FROM tasks WHERE parent = "module-20-product" ORDER BY id').all();
console.log('\n智能问数任务:');
verify.forEach(t => console.log(`  ${t.id} | ${t.text}`));

db.close();
