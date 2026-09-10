@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Yipin Smart Home preview is starting: http://127.0.0.1:4173
echo Keep this window open while previewing the website.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0preview-server.ps1"
