# 甘特图数据管理 - 正确工作流程

## 📅 最后更新时间
2026年2月24日 22:00

## ✅ 已验证的正确数据

### 智能问数助手（5个任务）
1. 本体建模 | 2026-01-20 ~ **2026-02-23** | 黄韵文
2. 数据接入和编排 | 2026-02-24 ~ 2026-02-28 | 孙攀
3. 用户权限体系联调 | 2026-02-28 ~ 2026-03-05 | 黄宇萌 欧阳军
4. 测试应用搭建 | 2026-02-28 ~ 2026-03-07 | 黄宇萌
5. 试运行启动 | 2026-03-10 ~ 2026-03-21 | 产品/交付

**关键点**：
- ✅ 只有5个任务（**没有"应用搭建"**）
- ✅ 本体建模截止日期是**2月23日**（不是24日）
- ✅ 包含"测试应用搭建"任务

### 订单进度查询（3个任务）
1. 物流信息查询的前后端开发
2. **正式应用搭建** (order-tracking-2)
3. 正式交付

**关键点**：
- ✅ order-tracking-2 是**"正式应用搭建"**（不是"测试应用搭建"）
- ✅ 只有3个任务（**没有"自动化物流更新"、"应用迁移至正式环境"**）

### 产品甘特图所有模块（11个）
1. AI 客服 (7x24h)
2. 智能问数助手
3. 产品智能推荐
4. 订单进度查询
5. AI 补货提醒
6. AI 付款提示
7. AI 系统监控告警
8. AI 合同审核
9. AI 商机识别
10. 内部知识库
11. AI 用户行为分析

## 🔄 正确的数据修改工作流程

### ⚠️ 重要规则
**只在前端（浏览器）修改数据，不要直接操作数据库！**

### 工作流程

#### 1. 在本地修改数据
```
1. 打开 http://localhost:3004
2. 登录（admin/admin123 或其他账号）
3. 在甘特图界面直接编辑、添加、删除任务
4. 修改完成后，前端会自动保存到：
   - 浏览器 localStorage
   - 云端数据库（通过API）
```

#### 2. 验证数据修改
```
在浏览器Console运行：
const data = JSON.parse(localStorage.getItem('gantt-storage-v3'));
const tasks = data.productTasks.filter(t => t.parent === 'module-20-product');
tasks.sort((a, b) => a.order - b.order);
tasks.forEach((t, i) => console.log(`${i+1}. ${t.text}`));
```

#### 3. 同步到Git（如果需要）
```bash
# 1. 从云服务器导出数据库
ssh root@59.110.21.174
cd /root/ai-gantt-chart/api
cp gantt.db gantt.db.backup_$(date +%Y%m%d_%H%M%S)
exit

# 2. 下载到本地
scp root@59.110.21.174:/root/ai-gantt-chart/api/gantt.db /Users/julianhuang/Projects/ai-gantt-chart/api/

# 3. 验证数据
cd /Users/julianhuang/Projects/ai-gantt-chart/api
node check-local-latest.js

# 4. 提交到Git
cd /Users/julianhuang/Projects/ai-gantt-chart
git add api/gantt.db
git commit -m "data: 更新数据库"
git push origin main
```

#### 4. 同步到其他环境（自动完成）
- ✅ 前端修改 → 自动保存到云数据库
- ✅ 无需手动同步云服务器

## 🚫 不要做的事

### ❌ 错误操作
1. **不要**直接修改SQLite数据库文件
2. **不要**手动编辑localStorage的JSON文件
3. **不要**在代码中硬编码任务数据（initial-data.json）
4. **不要**运行导入/导出脚本，除非是数据迁移

### ✅ 正确操作
1. **只在浏览器前端界面修改数据**
2. **使用前端提供的编辑、删除、添加功能**
3. **修改后验证浏览器Console显示的数据**
4. **需要备份时从云服务器导出数据库**

## 📁 文件说明

### 数据库文件
- `api/gantt.db` - 主数据库（Git跟踪）
- `api/gantt.db.backup_*` - 备份文件

### 前端配置
- `frontend/.env.production` - 生产环境API地址
- `frontend/src/data/initial-data.json` - ⚠️ 旧数据，不应再使用

### 数据脚本
- `api/check-local-latest.js` - 验证本地数据
- `api/verify-cloud.js` - 验证云数据
- `api/import-localstorage.js` - 从localStorage导入（紧急用）

## 🌐 环境说明

### 本地开发环境
- 地址: http://localhost:3004
- 用途: **数据修改的首选环境**
- 优势: 修改后立即生效，方便调试

### 云服务器环境
- 地址: http://59.110.21.174:3004
- 用途: 生产环境
- 数据: 自动从本地同步

### Git仓库
- 地址: git@github.com:opslilyhuang/product-projectganttchart.git
- 用途: 数据备份和版本控制
- 最新提交: 1d3cf40

## 🔧 故障排查

### 问题1: 前端显示旧数据
**解决**：
```javascript
// 在浏览器Console运行
localStorage.clear();
location.reload();
// 重新登录
```

### 问题2: API返回403
**原因**: 未登录或token过期
**解决**: 重新登录

### 问题3: 云服务器数据不对
**解决**：
```bash
# 前端修改数据会自动同步，无需手动操作
# 如需强制同步：
# 1. 在前端修改一次任一任务
# 2. 数据会自动保存到云数据库
```

## 📊 当前数据状态

### 统计
- 产品任务: 75个
- 项目任务: 47个
- 总任务数: 122个
- 用户: 4个（admin, julianhuang, viewer, 其他）

### 关键验证点
- ✅ 智能问数助手: 5个任务
- ✅ 订单进度查询: 3个任务
- ✅ 本体建模截止: 2026-02-23
- ✅ order-tracking-2: "正式应用搭建"

---

**重要**: 请遵循此文档的工作流程，避免数据混乱。如需帮助，请先检查浏览器Console的错误信息。
