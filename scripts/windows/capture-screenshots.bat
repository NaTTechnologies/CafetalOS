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

if not exist "node_modules\@playwright\test\cli.js" (
  echo [ERROR] Playwright no esta instalado. Ejecute instalar.bat.
  exit /b 1
)

echo [1/2] Preparando demo, limpieza y compilacion...
call npm run screenshots:prepare
if errorlevel 1 exit /b 1

echo [2/2] Generando capturas desktop y movil...
call npm run screenshots:run
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudieron generar las capturas.
  echo Revise test-results y playwright-report para el diagnostico.
  echo Para depurar: npm run screenshots:debug
  exit /b 1
)

echo.
echo [OK] Capturas guardadas en IMG\desktop e IMG\mobile.
