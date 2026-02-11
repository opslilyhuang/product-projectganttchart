#!/bin/bash

# AI 项目甘特图 - 启动脚本
# 端口: 3003

echo "🚀 启动 AI 项目甘特图服务器..."
echo ""

# 检查Python3是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    echo "请先安装 Python 3: https://www.python.org/downloads/"
    exit 1
fi

# 检查依赖是否安装
if ! python3 -c "import plotly" &> /dev/null; then
    echo "📦 检测到缺少依赖，正在安装..."
    pip3 install -r requirements.txt
    echo ""
fi

# 启动服务器
python3 server.py
