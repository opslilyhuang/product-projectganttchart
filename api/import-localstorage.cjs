#!/usr/bin/env node
/**
 * 从localStorage数据导入任务到数据库
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 读取local_data.json（完整数据，128个任务）
const dataPath = path.join(__dirname, '..', 'local_data.json');
const localStorageData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 打开数据库（当前目录的gantt.db）
const dbPath = path.join(__dirname, 'gantt.db');
const db = new Database(dbPath);

// 清空现有任务数据
console.log('清空现有任务...');
db.prepare('DELETE FROM tasks').run();

// 准备插入语句
const insertTask = db.prepare(`
  INSERT INTO tasks (
    id, text, type, parent, start_date, end_date, duration,
    progress, owner, phase, is_milestone, description, view,
    priority, status, "order"
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// 合并项目视图和产品视图任务
const allTasks = [...localStorageData.projectTasks, ...localStorageData.productTasks];

console.log(`开始导入 ${allTasks.length} 个任务...`);

let successCount = 0;
let errorCount = 0;

allTasks.forEach(task => {
  try {
    insertTask.run(
      task.id,
      task.text,
      task.type,
      task.parent === 0 ? null : task.parent,
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
      task.order !== undefined ? task.order : 0
    );
    successCount++;
  } catch (err) {
    console.error(`❌ 导入失败: ${task.id} - ${task.text}`);
    console.error(`   错误: ${err.message}`);
    errorCount++;
  }
});

console.log(`\n✅ 导入完成！`);
console.log(`   成功: ${successCount} 个`);
console.log(`   失败: ${errorCount} 个`);
console.log(`   总计: ${allTasks.length} 个`);

// 验证关键任务
const verifyTasks = db.prepare(`
  SELECT id, text, view
  FROM tasks
  WHERE id IN ('intelligent-query-1', 'task-21-product')
  ORDER BY id
`).all();

console.log(`\n📋 验证智能问数任务:`);
verifyTasks.forEach(task => {
  console.log(`   ${task.id} | ${task.text} | ${task.view}`);
});

db.close();
