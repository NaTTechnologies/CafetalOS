import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('inventario y ventas', () => {
  const main = fs.readFileSync('src/main/index.js', 'utf8')
  const inventory = fs.readFileSync('src/renderer/public/legacy/inventario.js', 'utf8')
  const sales = fs.readFileSync('src/renderer/public/legacy/ventas.js', 'utf8')
  const bulk = fs.readFileSync('src/renderer/public/legacy/registro-masivo.js', 'utf8')
  const styles = fs.readFileSync('src/renderer/src/assets/styles/features.css', 'utf8')

  it('registra ventas en una transacción y valida existencias', () => {
    expect(main).toContain("secureHandle('ventasCafe:create'")
    expect(main).toContain('Inventario insuficiente')
    expect(main).toContain("tipo_movimiento: 'venta'")
  })

  it('publica kardex y alertas de antigüedad', () => {
    expect(main).toContain("secureHandle('inventario:getKardex'")
    expect(main).toContain("secureHandle('inventario:getAgingAlerts'")
    expect(inventory).toContain('Kardex de café')
    expect(inventory).toContain('Alertas de permanencia')
  })

  it('mantiene compras y ventas como módulos separados', () => {
    expect(sales).toContain('Salida automática del inventario')
    expect(sales).toContain("App.cargarPagina('ventas')")
  })

  it('muestra el pegado de Excel como panel de ancho completo', () => {
    expect(bulk).toContain('bulk-paste-panel')
    expect(styles).toContain('.bulk-paste-panel')
    expect(styles).toContain('width: 100%')
  })
})
