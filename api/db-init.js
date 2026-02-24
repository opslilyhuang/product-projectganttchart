/**
 * 数据库初始化脚本
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'gantt.db'));

// 启用外键
db.pragma('foreign_keys = ON');

// 创建用户表（包含权限字段）
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    can_edit BOOLEAN DEFAULT 1, -- 全局编辑权限
    legacy_data_migrated BOOLEAN DEFAULT 0, -- 本地数据迁移标志
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建任务表
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'task',
    parent TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    duration INTEGER NOT NULL,
    progress REAL DEFAULT 0,
    status TEXT DEFAULT 'planned',
    owner TEXT,
    phase TEXT DEFAULT 'H1',
    priority TEXT DEFAULT 'medium',
    is_milestone INTEGER DEFAULT 0,
    description TEXT,
    color TEXT,
    readonly INTEGER DEFAULT 0,
    open INTEGER DEFAULT 1,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// 创建任务依赖关系表
db.exec(`
  CREATE TABLE IF NOT EXISTS task_links (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT '0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (target) REFERENCES tasks(id) ON DELETE CASCADE
  )
`);

// 创建配置表
db.exec(`
  CREATE TABLE IF NOT EXISTS configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    view TEXT DEFAULT 'month',
    readonly INTEGER DEFAULT 0,
    show_progress INTEGER DEFAULT 1,
    show_critical_path INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// 创建资源表（用于资源分配）
db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    capacity REAL DEFAULT 1.0,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// 创建资源分配表
db.exec(`
  CREATE TABLE IF NOT EXISTS resource_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    resource_id INTEGER NOT NULL,
    allocation REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE(task_id, resource_id)
  )
`);

// 创建活动日志表（用于实时协作）
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    task_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

console.log('✅ 数据库表创建成功！');

// 添加缺失的列到tasks表（如果不存在）
try {
  db.exec(`ALTER TABLE tasks ADD COLUMN view TEXT DEFAULT 'project'`);
  console.log('✅ 已添加 view 列到 tasks 表');
} catch (error) {
  console.log(`ℹ️  view 列可能已存在: ${error.message}`);
}

try {
  db.exec(`ALTER TABLE tasks ADD COLUMN "order" INTEGER DEFAULT 0`);
  console.log('✅ 已添加 order 列到 tasks 表');
} catch (error) {
  console.log(`ℹ️  order 列可能已存在: ${error.message}`);
}

// 创建默认管理员用户（用于测试）
import bcrypt from 'bcryptjs';

async function createAdminUser(username, email, password, fullName, role = 'admin', canEdit = 1) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role, status, can_edit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(username, email, hashedPassword, fullName, role, 'active', canEdit);
    const canEditText = canEdit === 1 ? '有编辑权限' : '只读权限';
    console.log(`✅ 用户创建成功 (用户名: ${username}, 密码: ${password}, 角色: ${role}, 权限: ${canEditText})`);
    return true;
  } catch (error) {
    console.log(`ℹ️  ${username} 用户已存在或创建失败:`, error.message);
    return false;
  }
}

// 创建默认管理员用户
await createAdminUser('admin', 'admin@example.com', 'admin123', '系统管理员');
await createAdminUser('julianhuang', 'julianhuang@example.com', '1234567890@', 'Julian Huang');

// 创建只读用户（viewer）
await createAdminUser('viewer', 'viewer@example.com', 'viewonly123', '查看用户', 'user', 0);

db.close();
console.log('✅ 数据库初始化完成！');
