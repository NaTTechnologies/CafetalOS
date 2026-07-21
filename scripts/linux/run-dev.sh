#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
[[ -d node_modules ]] || npm ci
./scripts/ensure-electron.sh
npm run dev
