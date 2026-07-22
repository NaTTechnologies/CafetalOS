import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('membrete profesional de reportes', () => {
  const main = fs.readFileSync('src/main/index.js', 'utf8')
  const schema = fs.readFileSync('database/schema.sql', 'utf8')

  it('incluye identidad, colores, logo y pie configurables', () => {
    for (const key of [
      'reporte_nombre_organizacion', 'reporte_logo_path', 'reporte_color_primario',
      'reporte_color_secundario', 'reporte_responsable', 'reporte_pie'
    ]) expect(schema).toContain(key)
  })

  it('numera páginas y agrega metadatos', () => {
    expect(main).toContain('drawReportHeader')
    expect(main).toContain('drawReportFooter')
    expect(main).toContain('bufferPages: true')
    expect(main).toContain('Creator: `Cafetal OS ${app.getVersion()}`')
  })
})
