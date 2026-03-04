@echo off
chcp 65001 >nul
title 苏超指挥中心 - 快速启动
echo 正在启动前后端服务...

:: 启动BFF
start "BFF-3000" cmd /k "cd bff && npm run dev"
timeout /t 2 >nul

:: 启动前端
start "前端-5173" cmd /k "npm run dev"

echo.
echo 服务已启动:
echo - 前端: http://localhost:5173
echo - BFF:  http://localhost:3000
echo.
pause
