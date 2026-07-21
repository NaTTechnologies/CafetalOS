import fs from 'node:fs'
import path from 'node:path'
import initSqlJs from 'sql.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('base de datos demo integral', () => {
  let db

  beforeAll(async () => {
    const SQL = await initSqlJs()
    const demoPath = path.resolve(process.cwd(), 'database/cafetal-os-demo.db')
    db = new SQL.Database(fs.readFileSync(demoPath))
  })

  afterAll(() => db?.close())

  const count = (table) => {
    const result = db.exec(`SELECT COUNT(*) AS total FROM ${table}`)
    return result[0].values[0][0]
  }

  it('incluye datos operativos de la finca', () => {
    expect(count('finca')).toBeGreaterThan(0)
    expect(count('lotes')).toBeGreaterThanOrEqual(8)
    expect(count('recoleccion')).toBeGreaterThan(500)
    expect(count('beneficio')).toBeGreaterThan(25)
    expect(count('inventario')).toBeGreaterThan(50)
    expect(count('gastos')).toBeGreaterThan(100)
  })

  it('permite explorar todos los módulos complementarios', () => {
    const requiredTables = [
      'huella_carbono',
      'practicas_regenerativas',
      'calidad_evaluaciones',
      'bloques_trazabilidad',
      'lotes_origen',
      'clientes_marketing',
      'campanas_marketing',
      'lealtad_puntos',
      'registros_clima',
      'alertas_fitosanitarias',
      'recomendaciones_cliente'
    ]

    for (const table of requiredTables) {
      expect(count(table), `${table} debe contener datos demo`).toBeGreaterThan(0)
    }
  })


  it('mantiene limpia la plantilla productiva', async () => {
    const SQL = await initSqlJs()
    const productionPath = path.resolve(process.cwd(), 'database/cafetal-os.db')
    const production = new SQL.Database(fs.readFileSync(productionPath))
    const productionCount = (table) => {
      const result = production.exec(`SELECT COUNT(*) AS total FROM ${table}`)
      return result[0].values[0][0]
    }

    expect(productionCount('finca')).toBe(0)
    expect(productionCount('lotes')).toBe(0)
    expect(productionCount('recolectores')).toBe(0)
    expect(productionCount('certificaciones')).toBe(0)
    expect(productionCount('precios_historicos')).toBe(0)
    expect(productionCount('variedades')).toBeGreaterThan(0)
    production.close()
  })

  it('conserva la continuidad de la cadena de trazabilidad', () => {
    const result = db.exec(
      'SELECT hash_bloque, hash_anterior FROM bloques_trazabilidad ORDER BY id ASC'
    )
    const rows = result[0].values

    expect(rows.length).toBeGreaterThan(10)
    expect(rows[0][1]).toBe('GENESIS')

    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index][1]).toBe(rows[index - 1][0])
    }
  })
})