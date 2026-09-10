@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 壹品居家智能体正在启动：http://127.0.0.1:4173
echo 请保持此窗口开启；关闭窗口即可停止预览。
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview-server.ps1"
