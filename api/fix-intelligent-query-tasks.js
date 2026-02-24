import Database from 'better-sqlite3';

const db = new Database('gantt.db');

// 获取智能问数助手的所有子任务
console.log('=== 修正前的智能问数助手任务 ===');
const tasks = db.prepare('SELECT id, text, "order" FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
tasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id})`);
});

// 根据正确的数据修正任务名称和顺序
// 正确的顺序应该是：
// 1. 本体建模 (intelligent-query-1)
// 2. 数据接入和编排 (intelligent-query-2)
// 3. 正式应用搭建 (intelligent-query-3) - 原名"应用搭建"
// 4. 用户权限体系联调 (task-22-product)
// 5. 应用迁移至正式环境 (intelligent-query-5) - 删除重复的intelligent-query-4
// 6. 试运行启动 (task-24-product)

console.log('\n开始修正任务...');

// 1. 确保intelligent-query-3是"正式应用搭建"
db.prepare('UPDATE tasks SET text = \'正式应用搭建\' WHERE id = \'intelligent-query-3\'').run();
console.log('✓ intelligent-query-3 设置为 "正式应用搭建"');

// 2. 删除重复的intelligent-query-4（它被错误地改名为"应用迁移至正式环境"）
const checkTask4 = db.prepare('SELECT text FROM tasks WHERE id = \'intelligent-query-4\'').get();
if (checkTask4) {
  db.prepare('DELETE FROM tasks WHERE id = \'intelligent-query-4\'').run();
  console.log('✓ 删除了重复的 intelligent-query-4');
}

// 3. 确保intelligent-query-5是"应用迁移至正式环境"
db.prepare('UPDATE tasks SET text = \'应用迁移至正式环境\' WHERE id = \'intelligent-query-5\'').run();
console.log('✓ intelligent-query-5 设置为 "应用迁移至正式环境"');

// 4. 修正顺序
const updates = [
  { id: 'intelligent-query-1', order: 1 },  // 本体建模
  { id: 'intelligent-query-2', order: 2 },  // 数据接入和编排
  { id: 'intelligent-query-3', order: 3 },  // 正式应用搭建
  { id: 'task-22-product', order: 4 },      // 用户权限体系联调
  { id: 'intelligent-query-5', order: 5 },  // 应用迁移至正式环境
  { id: 'task-24-product', order: 6 },      // 试运行启动
];

const updateOrder = db.prepare('UPDATE tasks SET "order" = ? WHERE id = ?');
updates.forEach(u => {
  updateOrder.run(u.order, u.id);
  console.log(`✓ ${u.id} order 设置为 ${u.order}`);
});

console.log('\n=== 修正后的智能问数助手任务 ===');
const updatedTasks = db.prepare('SELECT id, text, "order" FROM tasks WHERE parent = \'module-20-product\' ORDER BY "order"').all();
updatedTasks.forEach((t, idx) => {
  console.log(`  ${idx + 1}. ${t.text} (id: ${t.id}, order: ${t.order})`);
});

// 验证是否还有重复的任务名称
const taskNames = updatedTasks.map(t => t.text);
const duplicates = taskNames.filter((name, index) => taskNames.indexOf(name) !== index);
if (duplicates.length > 0) {
  console.log('\n⚠️  警告: 发现重复的任务名称:', duplicates);
} else {
  console.log('\n✅ 没有重复的任务名称');
}

db.close();
