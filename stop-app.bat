@echo off
chcp 65001 >nul
title 停止苏超应用

echo ==========================================
echo   苏超应用 - 一键停止脚本
echo ==========================================
echo.

:: 查找并终止占用 3000 端口的进程 (BFF后端)
echo [1/3] 正在查找占用 3000 端口的进程 (BFF后端)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo        发现进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo        ✓ 已终止进程 PID: %%a
    ) else (
        echo        × 终止失败或进程已退出
    )
)

:: 查找并终止占用 5173 端口的进程 (Vite前端)
echo [2/3] 正在查找占用 5173 端口的进程 (Vite前端)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo        发现进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo        ✓ 已终止进程 PID: %%a
    ) else (
        echo        × 终止失败或进程已退出
    )
)

:: 额外：查找 node.exe 进程（谨慎处理）
echo [3/3] 正在检查残留的 Node.js 进程...
setlocal enabledelayedexpansion
set "found=0"
for /f "skip=1 tokens=2" %%a in ('wmic process where "name='node.exe'" get processid 2^>nul') do (
    if "%%a" neq "" (
        set /a found+=1
        echo        发现 node.exe PID: %%a
    )
)

if !found! gtr 0 (
    echo.
    echo [!] 检测到 !found! 个 Node.js 进程
    set /p killall="是否终止所有 node.exe 进程? (Y/N): "
    if /i "!killall!"=="Y" (
        taskkill /F /IM node.exe >nul 2>&1
        echo        ✓ 已终止所有 node.exe 进程
    ) else (
        echo        - 跳过终止 node.exe 进程
    )
) else (
    echo        - 未发现残留的 Node.js 进程
)

echo.
echo ==========================================
echo   清理完成！3000 和 5173 端口已释放
echo ==========================================
echo.
pause
