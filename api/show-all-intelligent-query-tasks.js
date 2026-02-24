import Database from 'better-sqlite3';

const db = new Database('gantt.db');

// 查看智能问数助手模块的所有任务（包括子任务）
console.log('=== 智能问数助手模块下的所有任务 ===');
const getAllTasks = () => {
  const tasks = db.prepare('SELECT id, text, type, parent, "order" FROM tasks WHERE view = \'product\' ORDER BY "order"').all();

  // 找到智能问数助手模块
  const intelligentQueryModule = tasks.find(t => t.id === 'module-20-product');
  console.log('\n智能问数助手模块 (id: module-20-product):');

  // 找到所有子任务
  const printSubTasks = (parentId, indent = 0) => {
    const subTasks = tasks.filter(t => t.parent === parentId);
    subTasks.forEach(t => {
      console.log(`${'  '.repeat(indent + 1)}${t.text} (id: ${t.id}, order: ${t.order})`);
      printSubTasks(t.id, indent + 1);
    });
  };

  printSubTasks('module-20-product');
};

getAllTasks();

db.close();
