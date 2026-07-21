@echo off
setlocal
cd /d "%~dp0\..\.."

call node "scripts\check-electron.js" --binary-only >nul 2>nul
if not errorlevel 1 exit /b 0

echo [INFO] Descargando o reparando Electron...
call npx install-electron --no
if errorlevel 1 (
  echo [ERROR] No fue posible descargar Electron.
  echo Revise su conexion, DNS, proxy, antivirus o acceso a GitHub Releases.
  exit /b 1
)

call node "scripts\check-electron.js" --binary-only
if errorlevel 1 exit /b 1
exit /b 0
