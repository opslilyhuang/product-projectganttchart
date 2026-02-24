/**
 * 转换 localstorage-data.json 为 initial-data.json 格式
 */

const fs = require('fs');
const path = require('path');

// 读取 local_data.json（完整数据，128个任务）
const localStoragePath = path.join(__dirname, '..', 'local_data.json');
const localStorageData = JSON.parse(fs.readFileSync(localStoragePath, 'utf8'));

// 转换为 initial-data.json 格式
const initialData = {
  tasks: [...localStorageData.projectTasks, ...localStorageData.productTasks],
  links: localStorageData.links,
  config: localStorageData.config
};

// 写入 initial-data.json
const initialDataPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'initial-data.json');
fs.writeFileSync(initialDataPath, JSON.stringify(initialData, null, 2), 'utf8');

console.log('✅ 已转换并更新 initial-data.json');
console.log(`   项目任务: ${localStorageData.projectTasks.length}`);
console.log(`   产品任务: ${localStorageData.productTasks.length}`);
console.log(`   总任务数: ${initialData.tasks.length}`);

// 验证关键任务
const productQueryTasks = initialData.tasks.filter(t =>
  t.view === 'product' && t.parent === 'module-20-product'
);
console.log('\n🔍 产品甘特图 - 智能问数助手任务:');
productQueryTasks.forEach(t => {
  console.log(`   ${t.id}: ${t.text} (${t.owner || '无'})`);
});

const orderTasks = initialData.tasks.filter(t =>
  t.view === 'product' && t.parent === 'module-12-product'
);
console.log('\n🔍 产品甘特图 - 订单进度查询任务:');
orderTasks.forEach(t => {
  console.log(`   ${t.id}: ${t.text} (${t.owner || '无'})`);
});
