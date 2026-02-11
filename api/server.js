/**
 * Gantt Chart API Server
 * 提供完整的后端 API 和 WebSocket 实时协作功能
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 初始化
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3004', 'http://localhost:3007'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const db = new Database(join(__dirname, 'gantt.db'));
db.pragma('foreign_keys = ON');

// 中间件
app.use(cors({
  origin: ['http://localhost:3004', 'http://localhost:3007'],
  credentials: true,
}));
app.use(express.json());

// ====================================
// 认证中间件
// ====================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要认证' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token 无效' });
    }
    req.user = user;
    next();
  });
};

// ====================================
// 权限控制中间件
// ====================================

// 检查管理员权限
const checkAdmin = (req, res, next) => {
  // 从数据库获取用户完整信息（包括role）
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  next();
};

// 检查编辑权限
const checkEditPermission = (req, res, next) => {
  const user = db.prepare('SELECT can_edit FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  if (user.can_edit !== 1) {
    return res.status(403).json({ error: '您没有编辑权限' });
  }

  next();
};

// ====================================
// 认证 API
// ====================================

// 注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 哈希密码
    const password_hash = await bcrypt.hash(password, 10);

    // 创建用户（新注册用户默认为普通用户，有编辑权限）
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, status, can_edit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, password_hash, full_name, 'user', 'active', 1);

    // 生成 token
    const token = jwt.sign(
      { id: result.lastInsertRowid, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 获取新创建的用户完整信息
    const newUser = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit, legacy_data_migrated
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        status: newUser.status,
        can_edit: newUser.can_edit === 1,
        legacy_data_migrated: newUser.legacy_data_migrated === 1
      },
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?')
      .get(username, username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role || 'user',
        status: user.status || 'active',
        can_edit: user.can_edit === 1,
        legacy_data_migrated: user.legacy_data_migrated === 1
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// ====================================
// 用户管理 API（仅管理员）
// ====================================

// 获取所有用户（管理员权限）
app.get('/api/users', authenticateToken, checkAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit,
             legacy_data_migrated, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    // 移除密码哈希
    const sanitizedUsers = users.map(user => ({
      ...user,
      can_edit: user.can_edit === 1,
      legacy_data_migrated: user.legacy_data_migrated === 1
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 获取单个用户信息
app.get('/api/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    // 用户只能查看自己的信息，管理员可以查看所有用户
    if (req.user.id !== parseInt(id)) {
      const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ error: '无权查看其他用户信息' });
      }
    }

    const user = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit,
             legacy_data_migrated, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const sanitizedUser = {
      ...user,
      can_edit: user.can_edit === 1,
      legacy_data_migrated: user.legacy_data_migrated === 1
    };

    res.json(sanitizedUser);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 创建新用户（管理员权限）
app.post('/api/users', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const { username, email, password, full_name, role = 'user', status = 'active', can_edit = true } = req.body;

    // 检查用户是否已存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    // 哈希密码
    const password_hash = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, status, can_edit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, password_hash, full_name, role, status, can_edit ? 1 : 0);

    // 获取创建的用户信息（不包含密码）
    const newUser = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    const sanitizedUser = {
      ...newUser,
      can_edit: newUser.can_edit === 1
    };

    res.status(201).json(sanitizedUser);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ error: '创建用户失败' });
  }
});

// 更新用户信息（管理员权限或用户自己更新基本信息）
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 检查权限：用户只能更新自己的基本信息，管理员可以更新所有用户
    const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    const isAdmin = currentUser?.role === 'admin';
    const isSelf = req.user.id === parseInt(id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: '无权更新此用户信息' });
    }

    // 非管理员用户只能更新自己的基本信息，不能更新角色、状态、权限等
    if (!isAdmin) {
      const allowedFields = ['full_name', 'email'];
      const restrictedFields = ['role', 'status', 'can_edit', 'username'];

      for (const field of restrictedFields) {
        if (field in updates) {
          return res.status(403).json({ error: `无权更新 ${field} 字段` });
        }
      }
    }

    // 如果需要更新密码
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    // 构建更新SQL
    const updateFields = [];
    const updateValues = [];

    const fieldMapping = {
      username: 'username',
      email: 'email',
      full_name: 'full_name',
      role: 'role',
      status: 'status',
      can_edit: 'can_edit',
      password_hash: 'password_hash'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMapping[key]) {
        updateFields.push(`${fieldMapping[key]} = ?`);
        updateValues.push(key === 'can_edit' ? (value ? 1 : 0) : value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '没有有效的更新字段' });
    }

    updateValues.push(id);

    const sql = `
      UPDATE users
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.prepare(sql).run(...updateValues);

    // 获取更新后的用户信息
    const updatedUser = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit,
             legacy_data_migrated, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);

    const sanitizedUser = {
      ...updatedUser,
      can_edit: updatedUser.can_edit === 1,
      legacy_data_migrated: updatedUser.legacy_data_migrated === 1
    };

    res.json(sanitizedUser);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
});

// 删除用户（管理员权限）
app.delete('/api/users/:id', authenticateToken, checkAdmin, (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// 获取当前登录用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, full_name, role, status, can_edit,
             legacy_data_migrated, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const sanitizedUser = {
      ...user,
      can_edit: user.can_edit === 1,
      legacy_data_migrated: user.legacy_data_migrated === 1
    };

    res.json(sanitizedUser);
  } catch (error) {
    console.error('获取当前用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// ====================================
// 任务 API
// ====================================

// 获取所有任务
app.get('/api/tasks', authenticateToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? OR user_id IS NULL')
      .all(req.user.id);

    const links = db.prepare('SELECT * FROM task_links').all();

    res.json({ tasks, links });
  } catch (error) {
    console.error('获取任务错误:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建任务
app.post('/api/tasks', authenticateToken, checkEditPermission, (req, res) => {
  try {
    const task = req.body;

    const stmt = db.prepare(`
      INSERT INTO tasks (
        id, text, type, parent, start_date, end_date, duration, progress,
        status, owner, phase, priority, is_milestone, description,
        color, readonly, open, view, "order", user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      task.open !== undefined ? (task.open ? 1 : 0) : 1,
      task.view || 'project',
      task.order || 0,
      req.user.id
    );

    // 记录活动日志
    db.prepare(`
      INSERT INTO activity_logs (user_id, action, task_id, details)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, 'create', task.id, `创建任务: ${task.text}`);

    // 通过 WebSocket 广播更新
    io.emit('task_created', { task, userId: req.user.id });

    res.json({ success: true, task });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 更新任务
app.put('/api/tasks/:id', authenticateToken, checkEditPermission, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 动态构建SET子句
    const setClauses = [];
    const params = [];

    // 允许更新的字段列表
    const allowedFields = [
      'text', 'type', 'parent', 'start_date', 'end_date', 'duration',
      'progress', 'status', 'owner', 'phase', 'priority', 'is_milestone',
      'description', 'color', 'readonly', 'open', 'view', 'order'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        let value = updates[field];

        // 处理特殊字段类型
        if (field === 'is_milestone') {
          value = value ? 1 : 0;
        } else if (field === 'readonly' || field === 'open') {
          value = value ? 1 : 0;
        } else if (value === null || value === undefined) {
          value = null;
        }

        // 处理SQL关键字字段
        const columnName = field === 'order' ? '"order"' : field;
        setClauses.push(`${columnName} = ?`);
        params.push(value);
      }
    }

    // 如果没有要更新的字段，直接返回成功
    if (setClauses.length === 0) {
      return res.json({ success: true });
    }

    // 添加updated_at时间戳
    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    // 构建完整SQL语句
    const sql = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(id);

    // 执行更新
    db.prepare(sql).run(...params);

    // 获取任务文本用于日志
    const task = db.prepare('SELECT text FROM tasks WHERE id = ?').get(id);
    const taskText = task ? task.text : id;

    // 记录活动日志
    db.prepare(`
      INSERT INTO activity_logs (user_id, action, task_id, details)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, 'update', id, `更新任务: ${taskText}`);

    // 通过 WebSocket 广播更新
    io.emit('task_updated', { id, updates, userId: req.user.id });

    res.json({ success: true });
  } catch (error) {
    console.error('更新任务错误:', error);
    res.status(500).json({ error: '更新任务失败', details: error.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', authenticateToken, checkEditPermission, (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    // 记录活动日志
    db.prepare(`
      INSERT INTO activity_logs (user_id, action, task_id, details)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, 'delete', id, `删除任务`);

    // 通过 WebSocket 广播更新
    io.emit('task_deleted', { id, userId: req.user.id });

    res.json({ success: true });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

// ====================================
// 配置 API
// ====================================

// 获取用户配置
app.get('/api/config', authenticateToken, (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM configs WHERE user_id = ?')
      .get(req.user.id);

    if (!config) {
      // 创建默认配置
      const stmt = db.prepare(`
        INSERT INTO configs (user_id, view, readonly, show_progress, show_critical_path)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(req.user.id, 'month', 0, 1, 0);

      return res.json({
        view: 'month',
        readonly: false,
        showProgress: true,
        showCriticalPath: false,
      });
    }

    res.json({
      view: config.view,
      readonly: config.readonly === 1,
      showProgress: config.show_progress === 1,
      showCriticalPath: config.show_critical_path === 1,
    });
  } catch (error) {
    console.error('获取配置错误:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新用户配置
app.put('/api/config', authenticateToken, (req, res) => {
  try {
    const { view, readonly, showProgress, showCriticalPath } = req.body;

    db.prepare(`
      UPDATE configs
      SET view = ?, readonly = ?, show_progress = ?, show_critical_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(view, readonly ? 1 : 0, showProgress ? 1 : 0, showCriticalPath ? 1 : 0, req.user.id);

    res.json({ success: true });
  } catch (error) {
    console.error('更新配置错误:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// ====================================
// 数据迁移 API
// ====================================

// 从localStorage格式迁移数据到数据库
app.post('/api/migrate-data', authenticateToken, (req, res) => {
  try {
    const { tasks, links, config } = req.body;
    const userId = req.user.id;

    console.log(`开始为用户 ${userId} 迁移数据: ${tasks?.length || 0} 个任务, ${links?.length || 0} 个链接`);

    // 开始事务
    db.exec('BEGIN TRANSACTION');

    try {
      // 迁移任务
      if (tasks && Array.isArray(tasks)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO tasks (
            id, text, type, parent, start_date, end_date, duration, progress,
            status, owner, phase, priority, is_milestone, description,
            color, readonly, open, user_id, view, "order"
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const task of tasks) {
          // 确保任务有关联到当前用户
          stmt.run(
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
            userId,
            task.view || 'project',
            task.order || 0
          );
        }
        console.log(`✅ 已迁移 ${tasks.length} 个任务`);
      }

      // 迁移链接
      if (links && Array.isArray(links)) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO task_links (id, source, target, type)
          VALUES (?, ?, ?, ?)
        `);

        for (const link of links) {
          stmt.run(
            link.id,
            link.source,
            link.target,
            link.type || '0'
          );
        }
        console.log(`✅ 已迁移 ${links.length} 个链接`);
      }

      // 迁移配置
      if (config) {
        db.prepare(`
          INSERT OR REPLACE INTO configs (user_id, view, readonly, show_progress, show_critical_path)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          userId,
          config.view || 'month',
          config.readonly ? 1 : 0,
          config.showProgress ? 1 : 0,
          config.showCriticalPath ? 1 : 0
        );
        console.log('✅ 已迁移配置');
      }

      // 标记用户数据已迁移
      db.prepare('UPDATE users SET legacy_data_migrated = 1 WHERE id = ?')
        .run(userId);

      // 提交事务
      db.exec('COMMIT');

      console.log(`✅ 用户 ${userId} 数据迁移完成`);
      res.json({ success: true, message: '数据迁移成功' });

    } catch (error) {
      // 回滚事务
      db.exec('ROLLBACK');
      console.error('数据迁移事务错误:', error);
      throw error;
    }

  } catch (error) {
    console.error('数据迁移失败:', error);
    res.status(500).json({ error: '数据迁移失败', details: error.message });
  }
});

// ====================================
// 活动日志 API
// ====================================

app.get('/api/activities', authenticateToken, (req, res) => {
  try {
    const activities = db.prepare(`
      SELECT a.*, u.username, u.full_name
      FROM activity_logs a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all();

    res.json(activities);
  } catch (error) {
    console.error('获取活动日志错误:', error);
    res.status(500).json({ error: '获取活动日志失败' });
  }
});

// ====================================
// WebSocket 实时协作
// ====================================

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入
  socket.on('user_join', (userData) => {
    onlineUsers.set(socket.id, userData);
    io.emit('online_users', Array.from(onlineUsers.values()));
  });

  // 用户离开
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online_users', Array.from(onlineUsers.values()));
    console.log('用户断开:', socket.id);
  });

  // 实时任务编辑
  socket.on('task_editing', (data) => {
    socket.broadcast.emit('task_editing', data);
  });

  // 光标位置同步
  socket.on('cursor_move', (data) => {
    socket.broadcast.emit('cursor_move', data);
  });
});

// ====================================
// 启动服务器
// ====================================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Gantt Chart API Server 已启动!          ║
╠════════════════════════════════════════════╣
║   HTTP Server: http://localhost:${PORT}     ║
║   WebSocket: ws://localhost:${PORT}         ║
║                                            ║
║   功能:                                    ║
║   ✅ 用户认证 (JWT)                        ║
║   ✅ 任务 CRUD API                         ║
║   ✅ 实时协作 (WebSocket)                  ║
║   ✅ 活动日志                              ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
