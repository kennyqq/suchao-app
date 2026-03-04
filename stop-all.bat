@echo off
chcp 65001 >nul
title 苏超指挥中心 - 停止所有服务
echo.
echo ========================================
echo    正在停止前后端服务...
echo ========================================
echo.

echo [1/2] 正在停止 Node.js 进程...

:: 查找并终止前端服务进程（vite）
taskkill /F /IM node.exe /FI "WINDOWTITLE eq 前端*" >nul 2>&1

:: 查找并终止BFF服务进程
taskkill /F /IM node.exe /FI "WINDOWTITLE eq BFF*" >nul 2>&1

:: 备用：终止所有node进程（慎用）
:: taskkill /F /IM node.exe >nul 2>&1

echo [2/2] 服务已停止
echo.
echo ========================================
echo    所有服务已清理完毕
   echo ========================================
echo.
pause
