@echo off
setlocal
cd /d "%~dp0\..\.."
where node >nul 2>nul || (echo [ERROR] Node.js no esta instalado.& exit /b 1)
if not exist node_modules call npm install || exit /b 1
call npm test
