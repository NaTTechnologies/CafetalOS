#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
command -v node >/dev/null || { echo "[ERROR] Instale Node.js 22.12 o superior."; exit 1; }
node -e "const [major,minor]=process.versions.node.split('.').map(Number); if(major<22||(major===22&&minor<12)) process.exit(1)" || { echo "[ERROR] Se requiere Node.js 22.12 o superior."; exit 1; }
echo "[1/3] Instalando dependencias..."
npm ci
echo "[2/3] Verificando Electron..."
./scripts/ensure-electron.sh
echo "[3/3] Verificando el proyecto..."
npm run verify
echo "[OK] Cafetal OS está instalado y listo para desarrollo."
