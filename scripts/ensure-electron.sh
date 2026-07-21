#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if node scripts/check-electron.js --binary-only >/dev/null 2>&1; then
  exit 0
fi

echo "[INFO] Descargando o reparando Electron..."
npx install-electron --no
node scripts/check-electron.js --binary-only
