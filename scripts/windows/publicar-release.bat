@echo off
setlocal EnableExtensions
cd /d "%~dp0\..\.."

if "%~1"=="" (
  echo Uso: publicar-release.bat 2.6.0
  echo Tambien puede usar: publicar-release.bat v2.6.0
  exit /b 1
)

set "VERSION=%~1"
if /I "%VERSION:~0,1%"=="v" set "VERSION=%VERSION:~1%"
set "TAG=v%VERSION%"

where git >nul 2>nul || (
  echo [ERROR] Git no esta instalado o no esta disponible en PATH.
  exit /b 1
)

for /f "usebackq delims=" %%V in (`node -p "require('./package.json').version"`) do set "PACKAGE_VERSION=%%V"
if not "%PACKAGE_VERSION%"=="%VERSION%" (
  echo [ERROR] package.json tiene la version %PACKAGE_VERSION%, pero solicito %VERSION%.
  echo Actualice package.json, package-lock.json y CHANGELOG.md antes de publicar.
  exit /b 1
)

for /f "delims=" %%S in ('git status --porcelain') do (
  echo [ERROR] Hay cambios sin confirmar. Haga commit antes de crear la release.
  git status --short
  exit /b 1
)

git remote get-url origin >nul 2>nul || (
  echo [ERROR] No existe el remoto origin.
  exit /b 1
)

git rev-parse "%TAG%" >nul 2>nul && (
  echo [ERROR] La etiqueta %TAG% ya existe localmente.
  exit /b 1
)

echo Esta operacion publicara la rama actual y creara la etiqueta %TAG%.
set /p "CONFIRMAR=Escriba PUBLICAR para continuar: "
if /I not "%CONFIRMAR%"=="PUBLICAR" (
  echo Operacion cancelada.
  exit /b 1
)

git push origin HEAD
if errorlevel 1 exit /b 1

git tag -a "%TAG%" -m "Cafetal OS %VERSION%"
if errorlevel 1 exit /b 1

git push origin "%TAG%"
if errorlevel 1 exit /b 1

echo.
echo [OK] Etiqueta %TAG% enviada.
echo Revise la pestana Actions; al finalizar, la release aparecera en Releases.
