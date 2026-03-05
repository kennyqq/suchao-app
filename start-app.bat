@echo off
chcp 65001 >nul
title 苏超大屏智能指挥中心 - 一键启动

echo ╔═══════════════════════════════════════════════════════════╗
echo ║     苏超大屏智能指挥中心 - 一键启动脚本                    ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

:: 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [✓] Node.js 已安装

:: 获取当前目录
set "ROOT_DIR=%cd%"

:: 启动 BFF 后端服务
echo.
echo [1/3] 正在启动 BFF 后端服务...
echo     端口: 3000
echo     目录: %ROOT_DIR%\bff

start "BFF后端服务" cmd /c "cd /d "%ROOT_DIR%\bff" && npm run dev"

:: 等待 BFF 启动
timeout /t 3 /nobreak >nul

:: 检查 BFF 是否启动成功
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [警告] BFF 服务可能尚未就绪，继续启动前端...
) else (
    echo [✓] BFF 服务已启动
)

:: 启动前端服务
echo.
echo [2/3] 正在启动前端服务...
echo     端口: 5173
echo     目录: %ROOT_DIR%

start "前端服务" cmd /c "cd /d "%ROOT_DIR%" && npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo.
echo ═══════════════════════════════════════════════════════════
echo [3/3] 启动完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 服务地址:
echo   - 前端页面: http://localhost:5173
echo   - P0宏观溯源: http://localhost:5173/p0
echo   - BFF API: http://localhost:3000
echo   - API健康检查: http://localhost:3000/health
echo.
echo 数据状态:
echo   - P0时间切片: bff/output/p0/ 目录下
echo   - 时间轴索引: http://localhost:3000/api/v1/p0/timeline-index
echo.
echo 按任意键关闭所有服务窗口...
echo.

pause

:: 关闭服务窗口
taskkill /FI "WINDOWTITLE eq BFF后端服务*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq 前端服务*" /F >nul 2>&1

echo [✓] 服务已停止
