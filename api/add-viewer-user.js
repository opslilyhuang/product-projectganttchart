/**
 * 添加viewer用户到数据库
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'gantt.db'));

async function addViewerUser() {
  try {
    // 检查viewer用户是否已存在
    const existingUser = db.prepare('SELECT id, username FROM users WHERE username = ?').get('viewer');

    if (existingUser) {
      console.log('ℹ️  viewer 用户已存在，更新权限为只读...');

      // 更新为只读权限
      db.prepare('UPDATE users SET can_edit = 0 WHERE username = ?').run('viewer');
      console.log('✅ viewer 用户权限已更新为只读');
    } else {
      // 创建新用户
      const hashedPassword = await bcrypt.hash('viewonly123', 10);

      const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, full_name, role, status, can_edit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run('viewer', 'viewer@example.com', hashedPassword, '查看用户', 'user', 'active', 0);
      console.log('✅ viewer 用户创建成功');
      console.log('   用户名: viewer');
      console.log('   密码: viewonly123');
      console.log('   权限: 只读（不可编辑）');
    }

    // 查询并显示用户信息
    const user = db.prepare(`
      SELECT id, username, email, full_name, role, can_edit
      FROM users WHERE username = ?
    `).get('viewer');

    console.log('\n📋 viewer 用户信息:');
    console.log('   ID:', user.id);
    console.log('   用户名:', user.username);
    console.log('   邮箱:', user.email);
    console.log('   姓名:', user.full_name);
    console.log('   角色:', user.role);
    console.log('   可编辑:', user.can_edit === 1 ? '是' : '否（只读）');

  } catch (error) {
    console.error('❌ 添加viewer用户失败:', error);
  } finally {
    db.close();
  }
}

addViewerUser();
