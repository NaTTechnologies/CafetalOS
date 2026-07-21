@echo off
setlocal
cd /d "%~dp0\..\.."

where node >nul 2>nul || (
  echo [ERROR] Node.js no esta instalado.
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Instalando dependencias...
  call npm ci
  if errorlevel 1 exit /b 1
)

call "%~dp0ensure-electron.bat"
if errorlevel 1 exit /b 1

call npm run dev
