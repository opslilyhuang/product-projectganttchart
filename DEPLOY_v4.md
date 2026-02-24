# 甘特图数据版本 v4 部署说明

## 版本信息
- **数据版本**: v4
- **时间戳**: 2026-02-24T02:37:42.000Z
- **任务总数**: 128个（47个项目任务 + 81个产品任务）
- **Git提交**: b134e20

## 关键修复
- ✅ 智能问数助手任务名称修正为"本体建模"（而非"业务本体建模"）
- ✅ 订单进度查询移除了"第三方物流API接入"任务
- ✅ AI客服恢复完整的任务列表，包括"数据接入-非结构化文件直通本体"
- ✅ 前端默认使用正确的数据源，避免localStorage缓存问题

## 部署文件清单
- `dist-deploy-v4.tar.gz` - 完整部署包（588KB）
  - 前端构建文件 (dist/*)
  - 数据库文件 (gantt.db)
  - 完整数据源 (local_data.json)
  - 数据导入脚本 (import-localstorage.cjs)

## 云服务器部署步骤

### 方式一：直接替换文件（推荐）

1. 上传部署包到服务器：
```bash
scp dist-deploy-v4.tar.gz root@59.110.21.174:/root/ai-gantt-chart/
```

2. SSH 登录服务器：
```bash
ssh root@59.110.21.174
```

3. 备份当前文件：
```bash
cd /root/ai-gantt-chart
cp -r frontend/dist frontend/dist.backup.$(date +%Y%m%d_%H%M%S)
cp api/gantt.db api/gantt.db.backup.$(date +%Y%m%d_%H%M%S)
```

4. 解压并替换：
```bash
tar -xzf dist-deploy-v4.tar.gz -C /root/ai-gantt-chart/
# 如果前端和API在不同目录，请分别复制：
# cp -r dist/* /path/to/frontend/dist/
# cp gantt.db /path/to/api/gantt.db
```

5. 重启服务（如需要）：
```bash
# 重启 API 服务器（端口 3005）
pm2 restart gantt-api
# 或
systemctl restart gantt-api

# 重启前端服务器（端口 3004）
pm2 restart gantt-frontend
# 或
systemctl restart gantt-frontend
```

6. 验证部署：
访问 http://59.110.21.174:3004/ 检查前端
访问 http://59.110.21.174:3005/api/tasks 检查API

### 方式二：仅更新数据库

如果前端已经是最新版本，只需更新数据库：

1. 上传数据库文件：
```bash
scp api/gantt.db root@59.110.21.174:/root/ai-gantt-chart/api/
```

2. 重启 API 服务：
```bash
ssh root@59.110.21.174 "pm2 restart gantt-api"
```

### 方式三：通过数据导入脚本

如果服务器上已有数据导入脚本：

1. 上传完整数据源：
```bash
scp local_data.json root@59.110.21.174:/root/ai-gantt-chart/api/
```

2. 在服务器上执行导入：
```bash
ssh root@59.110.21.174
cd /root/ai-gantt-chart/api
node import-localstorage.cjs
pm2 restart gantt-api
```

## 验证数据正确性

### 浏览器控制台验证
访问 http://59.110.21.174:3004/，打开控制台执行：

```javascript
// 检查任务数量
const storedData = localStorage.getItem('gantt-storage-v3');
if (storedData) {
  const data = JSON.parse(storedData);
  console.log('数据版本:', data.version);
  console.log('时间戳:', data.timestamp);
  console.log('总任务数:', data.projectTasks.length + data.productTasks.length);

  // 验证关键任务
  const queryTask = data.productTasks.find(t => t.id === 'intelligent-query-1');
  console.log('智能问数助手:', queryTask?.text);

  const unstructuredTask = data.productTasks.find(t => t.id === 'ai-customer-service-2');
  console.log('AI客服非结构化任务:', unstructuredTask?.text);

  const orderTasks = data.productTasks.filter(t => t.parent === 'module-12-product');
  console.log('订单进度查询任务:', orderTasks.map(t => t.text));
} else {
  console.log('需要刷新页面加载数据');
}
```

### API验证
```bash
curl http://59.110.21.174:3005/api/tasks -H "Authorization: Bearer YOUR_TOKEN"
```

## 回滚方案

如果部署出现问题，可以快速回滚：

```bash
# 前端回滚
cd /root/ai-gantt-chart/frontend
rm -rf dist
mv dist.backup.YYYYMMDD_HHMMSS dist
pm2 restart gantt-frontend

# 数据库回滚
cd /root/ai-gantt-chart/api
rm gantt.db
mv gantt.db.backup.YYYYMMDD_HHMMSS gantt.db
pm2 restart gantt-api
```

## 本地备份文件

项目目录下已创建以下备份：
- `local_data_v4_20260224_103529.json` - 数据版本 v4 完整备份
- `dist-deploy-backup-*.tar.gz` - 旧版本部署包备份

## 技术支持

如遇到问题，请检查：
1. 服务器上的 API 地址配置（VITE_API_BASE_URL）
2. 数据库文件权限（确保可读可写）
3. PM2/系统服务日志：`pm2 logs gantt-api`
4. 浏览器控制台错误信息

---
**生成时间**: 2026-02-24 11:00
**数据版本**: v4
**部署包**: dist-deploy-v4.tar.gz (588KB)
