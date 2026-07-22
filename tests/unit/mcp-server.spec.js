import { describe, expect, it } from 'vitest'
import { __mcpTest } from '../../src/main/mcp-server.js'

describe('servidor MCP local', () => {
  it('expone tools de lectura por defecto', () => {
    const names = __mcpTest.toolDefinitions(false).map(tool => tool.name)
    expect(names).toContain('cafetal_resumen_general')
    expect(names).toContain('cafetal_analizar_lote')
    expect(names).toContain('cafetal_contexto_reporte')
    expect(names).toContain('cafetal_planillas_corte')
    expect(names).toContain('cafetal_resumen_compras')
    expect(names).toHaveLength(14)
    expect(names).not.toContain('cafetal_registrar_gasto')
  })

  it('solo expone tools de escritura con permiso explícito', () => {
    const names = __mcpTest.toolDefinitions(true).map(tool => tool.name)
    expect(names).toContain('cafetal_registrar_gasto')
    expect(names).toContain('cafetal_registrar_clima')
    expect(names).toContain('cafetal_registrar_alerta')
  })

  it('evita esquemas de entrada abiertos', () => {
    for (const tool of __mcpTest.toolDefinitions(true)) {
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.inputSchema.additionalProperties).toBe(false)
    }
  })

  it('selecciona la base demo cuando se solicita', () => {
    const result = __mcpTest.resolveDatabasePath({
      app: { getPath: () => '/tmp/cafetal-user-data' },
      resourcePath: (...parts) => ['/project', ...parts].join('/'),
      argv: ['electron', '--mcp', '--demo']
    })
    expect(result).toContain('cafetal-os-demo.db')
  })

  it('rechaza argumentos adicionales no publicados por la tool', () => {
    const tool = __mcpTest.toolDefinitions(false).find(item => item.name === 'cafetal_listar_lotes')
    expect(() => __mcpTest.validateToolArguments(tool, { acceso_sql: true })).toThrow(/no permitidos/i)
  })

  it('valida tipos y rangos de argumentos MCP', () => {
    const tool = __mcpTest.toolDefinitions(false).find(item => item.name === 'cafetal_listar_lotes')
    expect(() => __mcpTest.validateToolArguments(tool, { limite: 500 })).toThrow(/menor o igual/i)
    expect(() => __mcpTest.validateToolArguments(tool, { limite: '20' })).toThrow(/entero/i)
  })

  it('rechaza períodos invertidos', () => {
    expect(() => __mcpTest.dateRange('2025-02-01', '2025-01-01')).toThrow(/fecha final/i)
  })

})
