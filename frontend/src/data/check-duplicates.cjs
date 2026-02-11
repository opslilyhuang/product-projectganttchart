const fs = require('fs');
const path = require('path');

// 读取数据
const filePath = path.join(__dirname, 'initial-data.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

// 只处理产品任务
const productTasks = data.tasks.filter(task => task.view === 'product');

// 按模块分组
const tasksByParent = {};
productTasks.forEach(task => {
  const parent = task.parent || 'root';
  if (!tasksByParent[parent]) {
    tasksByParent[parent] = [];
  }
  tasksByParent[parent].push(task);
});

// 检查每个模块内的重复任务
console.log('检查产品甘特图任务重复情况:');
let totalDuplicates = 0;

Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const textCount = {};
  tasks.forEach(task => {
    const text = task.text;
    textCount[text] = (textCount[text] || 0) + 1;
  });

  const duplicates = Object.entries(textCount).filter(([text, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log(`\n模块 ${parent}:`);

    // 找出该模块的任务名称
    const moduleTask = data.tasks.find(t => t.id === parent);
    const moduleName = moduleTask ? moduleTask.text : parent;
    console.log(`  模块名称: ${moduleName}`);
    console.log(`  总任务数: ${tasks.length}`);
    console.log(`  重复任务:`);

    duplicates.forEach(([text, count]) => {
      console.log(`    - "${text}": ${count} 次`);
      totalDuplicates += count - 1;
    });

    // 显示重复任务详细信息
    console.log(`  重复任务详细信息:`);
    duplicates.forEach(([text, count]) => {
      const dupTasks = tasks.filter(t => t.text === text);
      console.log(`    "${text}":`);
      dupTasks.forEach((task, index) => {
        console.log(`      ${index + 1}. ID: ${task.id}, order: ${task.order}, start_date: ${task.start_date}, end_date: ${task.end_date}`);
      });
    });
  }
});

console.log(`\n总计: ${totalDuplicates} 个重复任务需要清理`);

// 检查新增任务格式的任务
console.log('\n检查新增任务格式任务:');
const newTaskPatterns = [
  'ai-customer-service-',
  'product-recommendation-',
  'order-tracking-',
  'ai-opportunity-',
  'intelligent-query-',
  'internal-knowledge-',
  'ai-replenishment-',
  'ai-payment-',
  'monitoring-alert-',
  'user-behavior-',
  'contract-review-'
];

newTaskPatterns.forEach(pattern => {
  const patternTasks = productTasks.filter(task => task.id.includes(pattern));
  console.log(`${pattern}*: ${patternTasks.length} 个任务`);
});

// 检查每个模块的总任务数
console.log('\n每个模块任务统计:');
Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = data.tasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;
  console.log(`${moduleName} (${parent}): ${tasks.length} 个任务`);
});