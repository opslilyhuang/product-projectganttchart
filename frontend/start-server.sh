#!/bin/bash

# 启动甘特图前端服务器脚本
# 固定端口: 3004

echo "🚀 启动甘特图前端服务器..."
echo "📍 端口: 3004"
echo "🌐 访问地址: http://localhost:3004"
echo ""

cd "$(dirname "$0")"

# 检查是否已有进程在运行
if lsof -i :3004 > /dev/null 2>&1; then
  echo "⚠️  端口 3004 已被占用"
  echo "正在查找进程..."
  lsof -i :3004
  echo ""
  read -p "是否要停止现有进程并重启? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 停止现有进程..."
    lsof -ti :3004 | xargs kill -9 2>/dev/null
    sleep 1
  else
    echo "❌ 取消启动"
    exit 1
  fi
fi

echo "✅ 启动服务器..."
npm run dev
