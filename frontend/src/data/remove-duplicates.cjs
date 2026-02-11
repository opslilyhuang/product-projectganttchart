const fs = require('fs');
const path = require('path');

// 备份原始数据
const filePath = path.join(__dirname, 'initial-data.json');
const backupPath = path.join(__dirname, 'initial-data.json.backup2');
fs.copyFileSync(filePath, backupPath);
console.log(`✅ 已备份数据到: ${backupPath}`);

// 读取数据
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

// 只处理产品任务
const productTasks = data.tasks.filter(task => task.view === 'product');
const otherTasks = data.tasks.filter(task => task.view !== 'product');

console.log(`总任务数: ${data.tasks.length}`);
console.log(`产品任务数: ${productTasks.length}`);
console.log(`其他任务数: ${otherTasks.length}`);

// 按模块分组
const tasksByParent = {};
productTasks.forEach(task => {
  const parent = task.parent || 'root';
  if (!tasksByParent[parent]) {
    tasksByParent[parent] = [];
  }
  tasksByParent[parent].push(task);
});

// 去重逻辑：对于每个模块，按任务文本去重
// 保留新增任务（模块ID-序号格式），删除旧任务（module-X-product-Y格式）
let removedCount = 0;
const tasksToRemove = new Set();

Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = data.tasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;

  console.log(`\n处理模块: ${moduleName} (${parent})`);
  console.log(`  原始任务数: ${tasks.length}`);

  // 按任务文本分组
  const tasksByText = {};
  tasks.forEach(task => {
    const text = task.text;
    if (!tasksByText[text]) {
      tasksByText[text] = [];
    }
    tasksByText[text].push(task);
  });

  // 找出重复任务
  Object.entries(tasksByText).forEach(([text, taskList]) => {
    if (taskList.length > 1) {
      console.log(`  重复任务: "${text}" (${taskList.length} 个)`);

      // 决定保留哪个任务
      // 优先保留新增任务（模块ID-序号格式）
      const newFormatTasks = taskList.filter(task =>
        task.id.includes('ai-customer-service-') ||
        task.id.includes('product-recommendation-') ||
        task.id.includes('order-tracking-') ||
        task.id.includes('ai-opportunity-') ||
        task.id.includes('intelligent-query-') ||
        task.id.includes('internal-knowledge-') ||
        task.id.includes('ai-replenishment-') ||
        task.id.includes('ai-payment-') ||
        task.id.includes('monitoring-alert-') ||
        task.id.includes('user-behavior-') ||
        task.id.includes('contract-review-')
      );

      const oldFormatTasks = taskList.filter(task => !newFormatTasks.includes(task));

      console.log(`    新增格式任务: ${newFormatTasks.length} 个`);
      console.log(`    旧格式任务: ${oldFormatTasks.length} 个`);

      if (newFormatTasks.length > 0) {
        // 保留新增任务，删除旧任务
        oldFormatTasks.forEach(task => {
          tasksToRemove.add(task.id);
          console.log(`    删除: ${task.id} (order: ${task.order})`);
        });
        removedCount += oldFormatTasks.length;

        // 如果有多个新增任务（不应该发生），只保留第一个
        if (newFormatTasks.length > 1) {
          console.log(`    警告: 有多个新增格式任务，保留第一个`);
          newFormatTasks.slice(1).forEach(task => {
            tasksToRemove.add(task.id);
            console.log(`    删除多余的新增任务: ${task.id}`);
            removedCount++;
          });
        }
      } else {
        // 没有新增格式任务，保留order最小的
        console.log(`    没有新增格式任务，保留order最小的`);
        const sortedTasks = [...taskList].sort((a, b) => (a.order || 0) - (b.order || 0));
        sortedTasks.slice(1).forEach(task => {
          tasksToRemove.add(task.id);
          console.log(`    删除: ${task.id} (order: ${task.order})`);
          removedCount++;
        });
      }
    }
  });
});

// 执行删除
const remainingTasks = data.tasks.filter(task => !tasksToRemove.has(task.id));

console.log(`\n删除完成:`);
console.log(`  原始任务数: ${data.tasks.length}`);
console.log(`  删除任务数: ${removedCount}`);
console.log(`  剩余任务数: ${remainingTasks.length}`);

// 重新计算产品任务的order值（按模块）
console.log(`\n重新计算order值...`);
const remainingProductTasks = remainingTasks.filter(task => task.view === 'product');

// 重新按模块分组
const remainingTasksByParent = {};
remainingProductTasks.forEach(task => {
  const parent = task.parent || 'root';
  if (!remainingTasksByParent[parent]) {
    remainingTasksByParent[parent] = [];
  }
  remainingTasksByParent[parent].push(task);
});

// 更新每个模块内的order值
Object.entries(remainingTasksByParent).forEach(([parent, tasks]) => {
  // 按开始时间排序
  const sortedTasks = [...tasks].sort((a, b) => {
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  // 分配连续的order值
  sortedTasks.forEach((task, index) => {
    const taskIndex = remainingTasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      remainingTasks[taskIndex] = {
        ...remainingTasks[taskIndex],
        order: index
      };
    }
  });
});

// 保存更新后的数据
data.tasks = remainingTasks;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ 去重完成!`);
console.log(`  删除重复任务: ${removedCount} 个`);
console.log(`  最终总任务数: ${remainingTasks.length}`);

// 验证结果
console.log(`\n验证去重结果:`);
const finalProductTasks = remainingTasks.filter(task => task.view === 'product');
const finalProductTasksByParent = {};
finalProductTasks.forEach(task => {
  const parent = task.parent || 'root';
  if (!finalProductTasksByParent[parent]) {
    finalProductTasksByParent[parent] = [];
  }
  finalProductTasksByParent[parent].push(task);
});

Object.entries(finalProductTasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = remainingTasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;

  // 检查重复
  const textSet = new Set();
  tasks.forEach(task => textSet.add(task.text));

  if (textSet.size < tasks.length) {
    console.log(`  ❌ ${moduleName}: 仍有重复任务`);
  } else {
    console.log(`  ✅ ${moduleName}: ${tasks.length} 个任务，无重复`);
  }
});