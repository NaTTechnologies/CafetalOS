import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('captura masiva y planillas semanales', () => {
  const source = fs.readFileSync('src/renderer/public/legacy/registro-masivo.js', 'utf8')
  const main = fs.readFileSync('src/main/index.js', 'utf8')
  const schema = fs.readFileSync('database/schema.sql', 'utf8')

  it('ofrece matrices para los módulos operativos y proveedores', () => {
    for (const entity of ['lote', 'recolector', 'cosecha', 'beneficio', 'inventario', 'gasto', 'proveedor_cafe', 'compra_cafe', 'clima', 'calidad']) {
      expect(source).toContain(`${entity}: {`)
    }
  })

  it('permite pegar tablas desde Excel y validar antes de guardar', () => {
    expect(source).toContain('Pegar desde Excel')
    expect(source).toContain('window.api.bulk.validate')
    expect(source).toContain('window.api.bulk.save')
    expect(main).toContain("db.run('BEGIN TRANSACTION')")
  })

  it('incluye la planilla semanal con fechas, cortadores y actualización idempotente', () => {
    expect(source).toContain('Planilla semanal de cortadores')
    expect(source).toContain('data-picker')
    expect(schema).toContain('UNIQUE (lote_id, semana_inicio)')
    expect(main).toContain("SELECT id FROM recoleccion WHERE planilla_id = ? AND recolector_id = ? AND fecha = ?")
    expect(source).toContain("getWeek({ loteId: Number(lotId), weekStart })")
    expect(source).not.toContain("getWeek({ loteId, weekStart })")
  })
})
