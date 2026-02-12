#!/usr/bin/env node

/**
 * 数据迁移脚本 - 将本地数据迁移到云端数据库
 */

import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const JWT_SECRET = 'your-secret-key-change-in-production';
const API_URL = 'http://localhost:3005/api/migrate-data';
const USER_ID = 2; // julianhuang用户ID
const USERNAME = 'julianhuang';
const EMAIL = 'julianhuang@example.com';

// 生成JWT token
function generateToken() {
  const payload = {
    id: USER_ID,
    username: USERNAME,
    email: EMAIL
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 从文件加载数据
function loadData() {
  try {
    // 尝试从多个位置加载数据
    const paths = [
      join(__dirname, 'frontend', 'src', 'data', 'initial-data.json'),
      join(__dirname, 'gantt-storage-backup.json'),
      join(__dirname, 'frontend', 'dist', 'data.json')
    ];

    for (const path of paths) {
      try {
        console.log(`尝试加载数据从: ${path}`);
        const data = JSON.parse(readFileSync(path, 'utf8'));

        if (data.tasks && Array.isArray(data.tasks)) {
          console.log(`✅ 从 ${path} 加载数据成功: ${data.tasks.length} 个任务`);

          // 转换数据格式以匹配StorageData接口
          const projectTasks = data.tasks.filter(task => task.view === 'project' || !task.view);
          const productTasks = data.tasks.filter(task => task.view === 'product');
          const links = data.links || [];
          const config = data.config || {
            view: 'month',
            readonly: false,
            showProgress: true,
            showCriticalPath: false
          };

          return {
            version: 3,
            timestamp: new Date().toISOString(),
            projectTasks,
            productTasks,
            links,
            config,
            resources: [],
            resourceAssignments: [],
            searchQueries: { project: '', product: '' }
          };
        }
      } catch (err) {
        // 文件不存在或解析失败，继续尝试下一个
        console.log(`❌ 从 ${path} 加载失败: ${err.message}`);
      }
    }

    throw new Error('无法从任何位置加载数据文件');
  } catch (error) {
    console.error('加载数据失败:', error.message);
    return null;
  }
}

// 执行迁移
async function migrate() {
  console.log('🚀 开始数据迁移到云端数据库');
  console.log('用户:', USERNAME, '(ID:', USER_ID, ')');

  // 生成token
  const token = generateToken();
  console.log('✅ JWT token生成成功');

  // 加载数据
  const data = loadData();
  if (!data) {
    console.error('❌ 无法加载数据，迁移中止');
    process.exit(1);
  }

  console.log(`📊 数据统计:`);
  console.log(`   项目任务: ${data.projectTasks.length} 个`);
  console.log(`   产品任务: ${data.productTasks.length} 个`);
  console.log(`   依赖链接: ${data.links.length} 个`);

  // 准备请求
  const requestBody = {
    tasks: [...data.projectTasks, ...data.productTasks],
    links: data.links,
    config: data.config
  };

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('📤 发送数据到API...');

    // 使用fetch API (Node.js 18+)
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ 迁移成功!');
    console.log('服务器响应:', result);

    // 验证数据库
    console.log('\n🔍 验证数据库...');
    const { execSync } = await import('child_process');

    const dbPath = join(__dirname, 'api', 'gantt.db');
    const userCheck = execSync(`sqlite3 "${dbPath}" "SELECT username, legacy_data_migrated FROM users WHERE id = ${USER_ID};"`).toString().trim();
    console.log(`用户迁移状态: ${userCheck}`);

    const taskCount = execSync(`sqlite3 "${dbPath}" "SELECT COUNT(*) as total, COUNT(CASE WHEN view = 'product' THEN 1 END) as product FROM tasks WHERE user_id = ${USER_ID};"`).toString().trim();
    console.log(`用户任务统计: ${taskCount}`);

    console.log('\n🎉 数据迁移完成!');
    console.log('现在可以访问 http://localhost:3004 查看云端数据');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 运行迁移
migrate().catch(error => {
  console.error('迁移过程出错:', error);
  process.exit(1);
});