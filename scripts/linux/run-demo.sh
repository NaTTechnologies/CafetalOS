#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
command -v node >/dev/null || { echo "Node.js no está instalado"; exit 1; }
[[ -d node_modules ]] || npm ci
./scripts/ensure-electron.sh
npm run demo:generate
npm run demo
