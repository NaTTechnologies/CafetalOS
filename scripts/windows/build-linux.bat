@echo off
setlocal
cd /d "%~dp0\..\.."
where node >nul 2>nul || (echo [ERROR] Node.js no esta instalado.& exit /b 1)
if not exist node_modules call npm ci || exit /b 1
echo NOTA: se recomienda ejecutar este comando en Linux o usar GitHub Actions.
call "%~dp0ensure-electron.bat" || exit /b 1
call npm run build:linux
