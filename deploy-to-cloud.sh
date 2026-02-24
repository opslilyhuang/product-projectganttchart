#!/bin/bash

# 甘特图 v4 数据自动部署脚本
# 用法: ./deploy-to-cloud.sh [服务器密码]

set -e

SERVER="root@59.110.21.174"
DEPLOY_DIR="/root/ai-gantt-chart"
LOCAL_DEPLOY_FILE="dist-deploy-v4.tar.gz"

echo "======================================"
echo "  甘特图 v4 数据部署到云服务器"
echo "======================================"
echo ""

# 检查部署文件是否存在
if [ ! -f "$LOCAL_DEPLOY_FILE" ]; then
    echo "❌ 错误: 找不到部署文件 $LOCAL_DEPLOY_FILE"
    echo "   请先运行构建命令创建部署包"
    exit 1
fi

echo "✅ 找到部署文件: $LOCAL_DEPLOY_FILE"
echo "   文件大小: $(du -h $LOCAL_DEPLOY_FILE | cut -f1)"
echo ""

# 1. 上传部署文件
echo "📤 [1/4] 上传部署文件到服务器..."
scp "$LOCAL_DEPLOY_FILE" "${SERVER}:${DEPLOY_DIR}/"
echo "✅ 上传完成"
echo ""

# 2. 备份现有文件
echo "💾 [2/4] 备份服务器现有文件..."
ssh "${SERVER}" << 'ENDSSH'
set -e
DEPLOY_DIR="/root/ai-gantt-chart"
BACKUP_SUFFIX=$(date +%Y%m%d_%H%M%S)

cd "$DEPLOY_DIR"

# 备份前端
if [ -d "frontend/dist" ]; then
    echo "  备份前端: frontend/dist -> frontend/dist.backup.$BACKUP_SUFFIX"
    cp -r frontend/dist frontend/dist.backup.$BACKUP_SUFFIX
else
    echo "  ⚠️  前端目录不存在，跳过备份"
fi

# 备份数据库
if [ -f "api/gantt.db" ]; then
    echo "  备份数据库: api/gantt.db -> api/gantt.db.backup.$BACKUP_SUFFIX"
    cp api/gantt.db api/gantt.db.backup.$BACKUP_SUFFIX
else
    echo "  ⚠️  数据库文件不存在，跳过备份"
fi

echo "✅ 备份完成"
ENDSSH
echo ""

# 3. 解压并替换文件
echo "📦 [3/4] 解压并替换文件..."
ssh "${SERVER}" << 'ENDSSH'
set -e
DEPLOY_DIR="/root/ai-gantt-chart"

cd "$DEPLOY_DIR"

# 创建临时解压目录
echo "  解压部署包..."
rm -rf temp-deploy
mkdir -p temp-deploy
tar -xzf dist-deploy-v4.tar.gz -C temp-deploy/

# 替换前端文件
echo "  替换前端文件..."
rm -rf frontend/dist
mkdir -p frontend/dist
cp -r temp-deploy/dist/* frontend/dist/

# 替换数据库文件
echo "  替换数据库文件..."
mkdir -p api
cp temp-deploy/gantt.db api/gantt.db

# 保留完整数据源和导入脚本
cp temp-deploy/local_data.json api/
cp temp-deploy/import-localstorage.cjs api/

# 清理临时目录
rm -rf temp-deploy

echo "✅ 文件替换完成"
ENDSSH
echo ""

# 4. 重启服务
echo "🔄 [4/4] 重启服务..."
ssh "${SERVER}" << 'ENDSSH'
set -e

# 检查 PM2 进程
if command -v pm2 &> /dev/null; then
    echo "  使用 PM2 重启服务..."

    # 重启 API 服务器
    if pm2 list | grep -q "gantt-api\|api"; then
        echo "  重启 API 服务器..."
        pm2 restart gantt-api 2>/dev/null || pm2 restart api 2>/dev/null || true
    fi

    # 重启前端服务器
    if pm2 list | grep -q "gantt-frontend\|frontend"; then
        echo "  重启前端服务器..."
        pm2 restart gantt-frontend 2>/dev/null || pm2 restart frontend 2>/dev/null || true
    fi

    echo "  PM2 进程状态:"
    pm2 list
else
    echo "  ⚠️  PM2 未找到，尝试使用 systemctl..."

    # 尝试使用 systemd
    if systemctl is-active --quiet gantt-api; then
        echo "  重启 API 服务 (systemctl)..."
        systemctl restart gantt-api
    fi

    if systemctl is-active --quiet gantt-frontend; then
        echo "  重启前端服务 (systemctl)..."
        systemctl restart gantt-frontend
    fi
fi

echo "✅ 服务重启完成"
ENDSSH
echo ""

# 5. 验证部署
echo "🔍 [验证] 检查服务状态..."
echo ""
echo "访问以下地址验证部署："
echo "  • 前端: http://59.110.21.174:3004/"
echo "  • API:  http://59.110.21.174:3005/api/tasks"
echo ""
echo "📋 数据验证 (在浏览器控制台执行):"
echo '  const data = JSON.parse(localStorage.getItem("gantt-storage-v3"));'
echo '  console.log("版本:", data.version);'
echo '  console.log("任务数:", data.projectTasks.length + data.productTasks.length);'
echo '  console.log("智能问数助手:", data.productTasks.find(t => t.id === "intelligent-query-1")?.text);'
echo ""
echo "======================================"
echo "  ✅ 部署完成！"
echo "======================================"
