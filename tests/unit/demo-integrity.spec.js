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



  it('incluye planillas, temporadas, compras y proveedores de demostración', () => {
    expect(count('temporadas_cafe')).toBeGreaterThan(0)
    expect(count('planillas_corte')).toBeGreaterThanOrEqual(3)
    expect(count('proveedores_cafe')).toBeGreaterThanOrEqual(5)
    expect(count('compras_cafe')).toBeGreaterThanOrEqual(5)
    expect(count('ventas_cafe')).toBeGreaterThanOrEqual(10)
    expect(count('progreso_educacion')).toBeGreaterThan(0)

    const result = db.exec(`SELECT COUNT(DISTINCT recolector_id), COUNT(DISTINCT fecha)
      FROM recoleccion WHERE planilla_id IS NOT NULL`)
    expect(result[0].values[0][0]).toBeGreaterThanOrEqual(10)
    expect(result[0].values[0][1]).toBeGreaterThanOrEqual(5)

    const salesLink = db.exec(`SELECT COUNT(*) FROM ventas_cafe v
      JOIN inventario i ON i.id = v.inventario_id
      WHERE v.estado = 'confirmada' AND i.tipo_movimiento = 'venta'`)
    expect(salesLink[0].values[0][0]).toBeGreaterThanOrEqual(10)
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
    expect(productionCount('temporadas_cafe')).toBe(0)
    expect(productionCount('planillas_corte')).toBe(0)
    expect(productionCount('proveedores_cafe')).toBe(0)
    expect(productionCount('compras_cafe')).toBe(0)
    expect(productionCount('ventas_cafe')).toBe(0)
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