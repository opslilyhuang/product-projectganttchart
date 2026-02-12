#!/usr/bin/env node

/**
 * 更新产品甘特图数据为公共数据
 * 将所有product视图的task的user_id设为NULL，使所有用户都能访问
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const DB_PATH = join(__dirname, 'gantt.db');

console.log('🚀 开始更新产品甘特图数据为公共数据');
console.log('数据库:', DB_PATH);

// 连接到数据库
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// 开始事务
console.log('🔄 开始数据库事务...');
db.exec('BEGIN TRANSACTION');

try {
  // 1. 首先检查当前状态
  console.log('\n📊 当前数据统计:');

  const statsBefore = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) as public_tasks,
      COUNT(CASE WHEN user_id = 2 THEN 1 END) as julianhuang_tasks,
      COUNT(CASE WHEN view = 'product' THEN 1 END) as product_tasks,
      COUNT(CASE WHEN view = 'project' THEN 1 END) as project_tasks
    FROM tasks
  `).get();

  console.log(`总任务数: ${statsBefore.total}`);
  console.log(`公共任务(user_id=NULL): ${statsBefore.public_tasks}`);
  console.log(`julianhuang用户任务: ${statsBefore.julianhuang_tasks}`);
  console.log(`产品任务(view='product'): ${statsBefore.product_tasks}`);
  console.log(`项目任务(view='project'): ${statsBefore.project_tasks}`);

  // 2. 查看当前产品任务的user_id分布
  const productStats = db.prepare(`
    SELECT user_id, COUNT(*) as count
    FROM tasks
    WHERE view = 'product'
    GROUP BY user_id
  `).all();

  console.log('\n📋 产品任务按用户分布:');
  for (const stat of productStats) {
    const userInfo = stat.user_id === null
      ? '公共(NULL)'
      : `用户ID=${stat.user_id}`;
    console.log(`  ${userInfo}: ${stat.count} 个任务`);
  }

  // 3. 更新所有产品任务为公共数据
  console.log('\n🔄 更新产品任务为公共数据...');
  const updateStmt = db.prepare(`
    UPDATE tasks
    SET user_id = NULL
    WHERE view = 'product'
  `);

  const updateResult = updateStmt.run();
  console.log(`✅ 更新完成: ${updateResult.changes} 个产品任务已设为公共`);

  // 4. 验证更新结果
  console.log('\n🔍 更新后验证:');

  const statsAfter = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) as public_tasks,
      COUNT(CASE WHEN user_id = 2 THEN 1 END) as julianhuang_tasks,
      COUNT(CASE WHEN view = 'product' THEN 1 END) as product_tasks,
      COUNT(CASE WHEN view = 'project' THEN 1 END) as project_tasks
    FROM tasks
  `).get();

  console.log(`总任务数: ${statsAfter.total}`);
  console.log(`公共任务(user_id=NULL): ${statsAfter.public_tasks}`);
  console.log(`julianhuang用户任务: ${statsAfter.julianhuang_tasks}`);
  console.log(`产品任务(view='product'): ${statsAfter.product_tasks}`);
  console.log(`项目任务(view='project'): ${statsAfter.project_tasks}`);

  const productStatsAfter = db.prepare(`
    SELECT user_id, COUNT(*) as count
    FROM tasks
    WHERE view = 'product'
    GROUP BY user_id
  `).all();

  console.log('\n📋 更新后产品任务按用户分布:');
  for (const stat of productStatsAfter) {
    const userInfo = stat.user_id === null
      ? '公共(NULL)'
      : `用户ID=${stat.user_id}`;
    console.log(`  ${userInfo}: ${stat.count} 个任务`);
  }

  // 5. 检查项目任务状态（应该保持用户隔离）
  console.log('\n🔍 项目任务状态（应保持用户隔离）:');
  const projectStats = db.prepare(`
    SELECT user_id, COUNT(*) as count
    FROM tasks
    WHERE view = 'project'
    GROUP BY user_id
  `).all();

  for (const stat of projectStats) {
    const userInfo = stat.user_id === null
      ? '公共(NULL)'
      : `用户ID=${stat.user_id}`;
    console.log(`  ${userInfo}: ${stat.count} 个任务`);
  }

  // 提交事务
  db.exec('COMMIT');
  console.log('\n✅ 事务提交成功');

  // 6. 为用户访问测试提供信息
  console.log('\n👥 用户访问测试:');
  console.log('现在所有用户登录后都能看到:');
  console.log('  - 106 个公共产品任务 (view="product", user_id=NULL)');
  console.log('  - 自己的项目任务 (view="project", user_id=用户ID)');

  // 测试不同用户的查询结果
  const users = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'julianhuang' },
    { id: 3, name: 'masterpro' },
    { id: 6, name: 'viewer' }
  ];

  console.log('\n🔍 模拟各用户登录后能看到的任务:');
  for (const user of users) {
    const userTasks = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN view = 'product' THEN 1 END) as product_count,
        COUNT(CASE WHEN view = 'project' THEN 1 END) as project_count
      FROM tasks
      WHERE user_id = ? OR user_id IS NULL
    `).get(user.id);

    console.log(`用户 ${user.name} (ID=${user.id}):`);
    console.log(`  总任务: ${userTasks.total}`);
    console.log(`  产品任务: ${userTasks.product_count}`);
    console.log(`  项目任务: ${userTasks.project_count}`);
  }

} catch (error) {
  // 回滚事务
  db.exec('ROLLBACK');
  console.error('❌ 更新失败，事务已回滚:', error.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n🎉 产品甘特图数据已成功设为公共数据!');
console.log('现在所有用户都可以访问相同的产品甘特图数据。');
console.log('\n操作建议:');
console.log('1. 重启前端: cd ../frontend && npm run dev');
console.log('2. 访问 http://localhost:3004');
console.log('3. 用不同用户登录测试产品甘特图数据是否一致');
console.log('4. 项目甘特图数据仍保持用户隔离');