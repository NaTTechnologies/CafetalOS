const path = require('node:path')
const { spawn } = require('node:child_process')
const readline = require('node:readline')

const child = spawn(process.execPath, [path.join(__dirname, 'run-mcp.cjs'), '--demo'], { cwd: path.resolve(__dirname, '..'), stdio: ['pipe', 'pipe', 'inherit'] })
const rl = readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
const pending = new Map()
let sequence = 0

function request(method, params = {}) {
  const id = ++sequence
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout esperando ${method}`)) }, 15000)
    pending.set(id, value => { clearTimeout(timer); resolve(value) })
  })
}

rl.on('line', line => {
  const message = JSON.parse(line)
  pending.get(message.id)?.(message)
  pending.delete(message.id)
})

;(async () => {
  try {
    const init = await request('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'cafetal-os-smoke', version: '1.0.0' } })
    if (init.error) throw new Error(init.error.message)
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    const list = await request('tools/list')
    if (list.error || !Array.isArray(list.result?.tools) || list.result.tools.length < 10) throw new Error('El servidor no publicó las tools esperadas.')
    const call = await request('tools/call', { name: 'cafetal_resumen_general', arguments: {} })
    if (call.error || !call.result?.structuredContent) throw new Error('La tool de resumen no respondió correctamente.')
    process.stderr.write(`[OK] MCP operativo con ${list.result.tools.length} tools en modo demo.\n`)
    child.stdin.end()
    child.kill()
  } catch (error) {
    process.stderr.write(`[ERROR] ${error.message}\n`)
    child.kill()
    process.exit(1)
  }
})()
