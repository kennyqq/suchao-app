@echo off
chcp 65001 >nul
title 苏超大屏 - 数据生成

echo ╔═══════════════════════════════════════════════════════════╗
echo ║     苏超大屏 - P0 时序数据生成                            ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/2] 正在生成 P0 小时级时序数据...
node bff/scripts/generateP0Data.js

if errorlevel 1 (
    echo.
    echo [错误] 数据生成失败！
    pause
    exit /b 1
)

echo.
echo [2/2] 验证数据文件...

echo   - 检查 timeline_index.json...
if exist "bff\output\p0\timeline_index.json" (
    echo     [✓] 时间轴索引存在
) else (
    echo     [✗] 时间轴索引缺失
)

echo   - 检查时间切片文件...
for /f %%i in ('dir /s /b "bff\output\p0\*.json" 2^>nul ^| find /c /v ""') do (
    echo     [✓] 共生成 %%i 个 JSON 文件
)

echo.
echo ═══════════════════════════════════════════════════════════
echo [✓] 数据生成完成！
echo ═══════════════════════════════════════════════════════════
echo.
echo 输出目录: %cd%\bff\output\p0\
echo.
echo 可以执行 start-app.bat 启动服务了！
echo.
pause
