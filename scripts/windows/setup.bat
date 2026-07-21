@echo off
setlocal
cd /d "%~dp0\..\.."

where node >nul 2>nul || (
  echo [ERROR] Instale Node.js 22.12 o superior.
  exit /b 1
)

node -e "const [major,minor]=process.versions.node.split('.').map(Number); if(major<22||(major===22&&minor<12)) process.exit(1)" || (
  echo [ERROR] Se requiere Node.js 22.12 o superior.
  exit /b 1
)

echo [1/3] Instalando dependencias...
call npm ci
if errorlevel 1 exit /b 1

echo [2/3] Verificando Electron...
call "%~dp0ensure-electron.bat"
if errorlevel 1 exit /b 1

echo [3/3] Verificando el proyecto...
call npm run verify
if errorlevel 1 exit /b 1

echo.
echo [OK] Cafetal OS esta instalado y listo para desarrollo.
