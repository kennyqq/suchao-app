@echo off
chcp 65001 >nul
echo ==========================================
echo    苏超智能化指挥中心 - 一键启动脚本
echo ==========================================
echo.

:: 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js 已安装
node -v

:: 检查 .env 文件
if not exist ".env" (
    echo.
    echo [警告] 未找到 .env 文件，正在从示例创建...
    copy .env.example .env
    echo [✓] 已创建 .env 文件，请编辑填入你的高德地图 Key
    echo.
    start notepad .env
    pause
)

:: 检查 node_modules
if not exist "node_modules" (
    echo.
    echo [信息] 首次运行，正在安装依赖...
    npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo [✓] 依赖已安装

:: 启动项目
echo.
echo [信息] 正在启动开发服务器...
echo [信息] 请稍后，首次启动需要 10-20 秒...
echo.
npm run dev

pause
