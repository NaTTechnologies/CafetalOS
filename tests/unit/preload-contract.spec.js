import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
describe('preload contract', () => {
  const source = fs.readFileSync('src/preload/index.js', 'utf8')
  it('uses contextBridge', () => expect(source).toContain("contextBridge.exposeInMainWorld('api'"))
  it('does not expose a generic invoke function', () => expect(source).not.toMatch(/invoke:\s*\(channel/))
  it('returns a cleanup function for menu listeners', () => expect(source).toContain('removeListener(channel, listener)'))
  it('exposes core coffee modules', () => ['finca','lotes','cosecha','temporadas','planillas','proveedoresCafe','comprasCafe','bulk','beneficio','inventario','ventasCafe','gastos','clima','config','mcp'].forEach(key => expect(source).toContain(`${key}: {`)))
})
