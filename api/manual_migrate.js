#!/usr/bin/env node

/**
 * 手动数据迁移脚本 - 将产品甘特图数据插入数据库
 * 为julianhuang用户迁移数据
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const DB_PATH = join(__dirname, 'gantt.db');
const USER_ID = 2; // julianhuang用户ID
const USERNAME = 'julianhuang';

// 数据文件路径
const INITIAL_DATA_PATH = join(__dirname, '..', 'frontend', 'src', 'data', 'initial-data.json');

console.log('🚀 开始手动数据迁移');
console.log('数据库:', DB_PATH);
console.log('用户:', USERNAME, '(ID:', USER_ID, ')');
console.log('数据文件:', INITIAL_DATA_PATH);

// 读取初始数据
let initialData;
try {
  const dataContent = readFileSync(INITIAL_DATA_PATH, 'utf8');
  initialData = JSON.parse(dataContent);
  console.log(`✅ 数据加载成功: ${initialData.tasks?.length || 0} 个任务`);
} catch (error) {
  console.error('❌ 无法读取数据文件:', error.message);
  process.exit(1);
}

// 连接到数据库
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// 开始事务
console.log('🔄 开始数据库事务...');
db.exec('BEGIN TRANSACTION');

try {
  // 1. 筛选产品任务 (view === 'product')
  const productTasks = initialData.tasks.filter(task => task.view === 'product');
  console.log(`📊 产品任务数量: ${productTasks.length}`);

  if (productTasks.length === 0) {
    console.log('⚠️  没有找到产品任务，检查view字段');
    // 如果没有view字段，尝试查找特定任务
    const allTasks = initialData.tasks;
    console.log(`总任务数: ${allTasks.length}`);

    // 显示前几个任务查看结构
    for (let i = 0; i < Math.min(5, allTasks.length); i++) {
      console.log(`任务 ${i}: id=${allTasks[i].id}, text="${allTasks[i].text.substring(0, 30)}..."`);
    }
  }

  // 2. 插入产品任务
  const taskStmt = db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, text, type, parent, start_date, end_date, duration, progress,
      status, owner, phase, priority, is_milestone, description,
      color, readonly, open, user_id, view, "order"
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let insertedTasks = 0;
  let skippedTasks = 0;

  for (const task of productTasks) {
    try {
      taskStmt.run(
        task.id,
        task.text,
        task.type || 'task',
        task.parent || null,
        task.start_date,
        task.end_date,
        task.duration || 1,
        task.progress || 0,
        task.status || 'planned',
        task.owner || '',
        task.phase || 'H1',
        task.priority || 'medium',
        task.is_milestone ? 1 : 0,
        task.description || null,
        task.color || null,
        task.readonly ? 1 : 0,
        task.open ? 1 : 1,
        USER_ID, // 关联到julianhuang用户
        'product', // 确保view字段为'product'
        task.order || 0
      );
      insertedTasks++;
    } catch (error) {
      console.warn(`⚠️  插入任务 ${task.id} 时出错: ${error.message}`);
      skippedTasks++;
    }
  }

  console.log(`✅ 任务插入完成: ${insertedTasks} 个成功, ${skippedTasks} 个跳过`);

  // 3. 插入依赖链接
  const links = initialData.links || [];
  const linkStmt = db.prepare(`
    INSERT OR REPLACE INTO task_links (id, source, target, type)
    VALUES (?, ?, ?, ?)
  `);

  let insertedLinks = 0;
  for (const link of links) {
    try {
      linkStmt.run(
        link.id,
        link.source,
        link.target,
        link.type || '0'
      );
      insertedLinks++;
    } catch (error) {
      console.warn(`⚠️  插入链接 ${link.id} 时出错: ${error.message}`);
    }
  }

  console.log(`✅ 链接插入完成: ${insertedLinks} 个链接`);

  // 4. 插入配置
  const config = initialData.config || {
    view: 'month',
    readonly: false,
    showProgress: true,
    showCriticalPath: false
  };

  const configStmt = db.prepare(`
    INSERT OR REPLACE INTO configs (user_id, view, readonly, show_progress, show_critical_path)
    VALUES (?, ?, ?, ?, ?)
  `);

  configStmt.run(
    USER_ID,
    config.view || 'month',
    config.readonly ? 1 : 0,
    config.showProgress ? 1 : 0,
    config.showCriticalPath ? 1 : 0
  );

  console.log('✅ 配置插入完成');

  // 5. 标记用户数据已迁移
  db.prepare('UPDATE users SET legacy_data_migrated = 1 WHERE id = ?')
    .run(USER_ID);

  console.log('✅ 用户迁移标志已更新');

  // 提交事务
  db.exec('COMMIT');
  console.log('✅ 事务提交成功');

} catch (error) {
  // 回滚事务
  db.exec('ROLLBACK');
  console.error('❌ 迁移失败，事务已回滚:', error.message);
  process.exit(1);
} finally {
  db.close();
}

// 验证结果
console.log('\n🔍 验证数据库结果...');

// 重新连接数据库验证
const dbVerify = new Database(DB_PATH);

// 检查用户迁移状态
const userStatus = dbVerify.prepare('SELECT username, legacy_data_migrated FROM users WHERE id = ?').get(USER_ID);
console.log(`用户 ${userStatus.username} 迁移状态: ${userStatus.legacy_data_migrated ? '已迁移' : '未迁移'}`);

// 检查任务统计
const taskStats = dbVerify.prepare(`
  SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN view = 'product' THEN 1 END) as product_tasks,
    COUNT(CASE WHEN view = 'project' THEN 1 END) as project_tasks
  FROM tasks WHERE user_id = ?
`).get(USER_ID);

console.log(`任务统计:`);
console.log(`  总任务: ${taskStats.total}`);
console.log(`  产品任务: ${taskStats.product_tasks}`);
console.log(`  项目任务: ${taskStats.project_tasks}`);

// 检查链接数量
const linkCount = dbVerify.prepare('SELECT COUNT(*) as count FROM task_links').get();
console.log(`依赖链接: ${linkCount.count}`);

dbVerify.close();

console.log('\n🎉 数据迁移完成!');
console.log('现在可以:');
console.log('1. 访问 http://localhost:3004');
console.log('2. 使用用户名 "julianhuang" 登录');
console.log('3. 切换到"产品甘特图"视图查看数据');
console.log('4. 如果需要，使用工具栏"迁移到云端"按钮迁移更多数据');