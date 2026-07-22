const fs = require('node:fs')
const path = require('node:path')
const { spawnSync, spawn } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const entry = path.join(root, 'out', 'main', 'index.js')

if (!fs.existsSync(entry)) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const build = spawnSync(npm, ['run', 'build:app'], { cwd: root, stdio: ['ignore', process.stderr, process.stderr] })
  if (build.status !== 0) process.exit(build.status || 1)
}

let electron
try { electron = require('electron') } catch (_error) {
  process.stderr.write('[Cafetal OS MCP] Electron no está instalado. Ejecute npm ci y npx install-electron --no.\n')
  process.exit(1)
}

const child = spawn(electron, [root, '--mcp', ...process.argv.slice(2)], { cwd: root, stdio: 'inherit', windowsHide: true })
child.on('exit', code => process.exit(code ?? 0))
child.on('error', error => { process.stderr.write(`[Cafetal OS MCP] ${error.message}\n`); process.exit(1) })
