#!/bin/bash

echo "=========================================="
echo "   苏超智能化指挥中心 - 一键启动脚本"
echo "=========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    read -n 1 -s -r -p "按任意键退出..."
    exit 1
fi

echo "[✓] Node.js 已安装: $(node -v)"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo ""
    echo "[警告] 未找到 .env 文件，正在从示例创建..."
    cp .env.example .env
    echo "[✓] 已创建 .env 文件，请编辑填入你的高德地图 Key"
    echo ""
    if command -v code &> /dev/null; then
        code .env
    elif command -v vim &> /dev/null; then
        vim .env
    elif command -v nano &> /dev/null; then
        nano .env
    fi
    read -n 1 -s -r -p "配置完成后按任意键继续..."
fi

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[信息] 首次运行，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        read -n 1 -s -r -p "按任意键退出..."
        exit 1
    fi
fi

echo "[✓] 依赖已安装"

# 启动项目
echo ""
echo "[信息] 正在启动开发服务器..."
echo "[信息] 请稍后，首次启动需要 10-20 秒..."
echo ""
npm run dev
