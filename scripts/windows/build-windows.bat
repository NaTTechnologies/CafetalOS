@echo off
setlocal
cd /d "%~dp0\..\.."
where node >nul 2>nul || (echo [ERROR] Node.js no esta instalado.& exit /b 1)
if not exist node_modules call npm ci || exit /b 1
call "%~dp0ensure-electron.bat" || exit /b 1
call npm run build:win
