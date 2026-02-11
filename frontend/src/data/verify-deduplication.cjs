const fs = require('fs');
const path = require('path');

// 读取数据
const filePath = path.join(__dirname, 'initial-data.json');
const rawData = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(rawData);

console.log('去重后数据验证:');
console.log(`总任务数: ${data.tasks.length}`);

// 按视图统计
const projectTasks = data.tasks.filter(task => task.view === 'project');
const productTasks = data.tasks.filter(task => task.view === 'product');

console.log(`项目任务数: ${projectTasks.length}`);
console.log(`产品任务数: ${productTasks.length}`);

// 检查产品任务是否包含新增任务
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

console.log('\n新增任务统计:');
let totalNewTasks = 0;
newTaskPatterns.forEach(pattern => {
  const patternTasks = productTasks.filter(task => task.id.includes(pattern));
  console.log(`${pattern}*: ${patternTasks.length} 个任务`);
  totalNewTasks += patternTasks.length;
});

console.log(`新增任务总数: ${totalNewTasks}`);

// 检查每个模块的任务数量
console.log('\n每个模块任务统计:');
const tasksByParent = {};
productTasks.forEach(task => {
  const parent = task.parent || 'root';
  if (!tasksByParent[parent]) {
    tasksByParent[parent] = [];
  }
  tasksByParent[parent].push(task);
});

Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = data.tasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;
  console.log(`${moduleName} (${parent}): ${tasks.length} 个任务`);
});

// 检查重复
console.log('\n重复检查:');
let hasDuplicates = false;
Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = data.tasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;

  const textSet = new Set();
  tasks.forEach(task => textSet.add(task.text));

  if (textSet.size < tasks.length) {
    console.log(`❌ ${moduleName}: 有重复任务`);
    hasDuplicates = true;
  }
});

if (!hasDuplicates) {
  console.log('✅ 所有模块均无重复任务');
}

// 验证order值连续性
console.log('\norder值验证:');
Object.entries(tasksByParent).forEach(([parent, tasks]) => {
  const moduleTask = data.tasks.find(t => t.id === parent);
  const moduleName = moduleTask ? moduleTask.text : parent;

  // 获取该模块下的所有任务
  const moduleTasks = tasks.filter(task => task.parent === parent);

  if (moduleTasks.length > 0) {
    // 按order排序
    const sortedTasks = [...moduleTasks].sort((a, b) => (a.order || 0) - (b.order || 0));

    // 检查order是否连续
    let orderValid = true;
    for (let i = 0; i < sortedTasks.length; i++) {
      if (sortedTasks[i].order !== i) {
        orderValid = false;
        break;
      }
    }

    if (orderValid) {
      console.log(`✅ ${moduleName}: order值连续 (0-${sortedTasks.length - 1})`);
    } else {
      console.log(`⚠️ ${moduleName}: order值不连续`);
      console.log(`  实际order值: ${sortedTasks.map(t => t.order).join(', ')}`);
    }
  }
});