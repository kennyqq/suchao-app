@echo off
chcp 65001 >nul
title 苏超智能化指挥中心 - 一键启动前后端服务
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║        苏超智能化指挥中心 - 一键启动前后端服务               ║
echo ║        Frontend + BFF Backend Launcher                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 检查是否安装了 Node.js
echo [1/4] 正在检查 Node.js 环境...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+ 版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [1/4] Node.js 版本: 
node -v
echo.

:: 检查前端依赖
echo [2/4] 正在检查前端依赖...
if not exist "node_modules" (
    echo [提示] 前端依赖未安装，正在执行 npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [2/4] 前端依赖已安装
)
echo.

:: 检查BFF依赖
echo [3/4] 正在检查 BFF 中台依赖...
if not exist "bff\node_modules" (
    echo [提示] BFF依赖未安装，正在执行 npm install...
    cd bff
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] BFF依赖安装失败
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [3/4] BFF依赖已安装
)
echo.

:: 启动服务
echo [4/4] 正在启动前后端服务...
echo.
echo ========================================
echo  启动中...
echo  前端地址: http://localhost:5173
echo  BFF地址:  http://localhost:3000
echo ========================================
echo.

:: 启动 BFF 后端服务 (在新窗口)
echo [启动] BFF 中台服务 (端口: 3000)...
start "BFF中台服务 - 端口3000" cmd /k "cd /d "%~dp0bff" && echo 正在启动BFF服务... && npm run dev"

:: 等待2秒让BFF先启动
timeout /t 2 /nobreak >nul

:: 启动前端服务 (在新窗口)
echo [启动] 前端服务 (端口: 5173)...
start "前端服务 - 端口5173" cmd /k "cd /d "%~dp0" && echo 正在启动前端服务... && npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    所有服务已启动！                          ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  前端访问地址: http://localhost:5173                         ║
echo ║  BFF API地址:  http://localhost:3000                         ║
echo ║  P2聚合接口:   http://localhost:3000/api/v1/p2/indoor-micro ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo [提示] 请查看上方弹出的命令窗口获取详细启动日志
echo [提示] 按任意键关闭此窗口（服务继续在后台运行）
pause >nul
