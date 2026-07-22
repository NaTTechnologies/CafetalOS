import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import initSqlJs from 'sql.js'
import { validateEntity } from './domain-validation.js'

const PROTOCOL_VERSION = '2025-11-25'
const SUPPORTED_PROTOCOL_VERSIONS = new Set(['2025-11-25', '2025-06-18', '2024-11-05'])
const SERVER_NAME = 'cafetal-os-local'

function stderr(message) {
  process.stderr.write(`[Cafetal OS MCP] ${message}\n`)
}

function asNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function isoDate(value, fallback) {
  if (!value) return fallback
  const text = String(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Fecha inválida: ${text}. Use YYYY-MM-DD.`)
  return text
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function startOfYear() {
  return `${new Date().getFullYear()}-01-01`
}

function dateRange(fechaInicio, fechaFin) {
  const start = isoDate(fechaInicio, startOfYear())
  const end = isoDate(fechaFin, today())
  if (end < start) throw new Error('La fecha final no puede ser anterior a la fecha inicial.')
  return { start, end }
}

function validateToolArguments(tool, rawArguments = {}) {
  if (!rawArguments || typeof rawArguments !== 'object' || Array.isArray(rawArguments)) {
    throw new Error('Los argumentos de la tool deben ser un objeto JSON.')
  }
  const schema = tool?.inputSchema || { type: 'object', properties: {} }
  const properties = schema.properties || {}
  if (schema.additionalProperties === false) {
    const unknown = Object.keys(rawArguments).filter(key => !Object.hasOwn(properties, key))
    if (unknown.length) throw new Error(`Argumentos no permitidos: ${unknown.join(', ')}.`)
  }
  for (const required of schema.required || []) {
    if (rawArguments[required] === undefined || rawArguments[required] === null || rawArguments[required] === '') {
      throw new Error(`El argumento ${required} es obligatorio.`)
    }
  }
  for (const [key, value] of Object.entries(rawArguments)) {
    const rule = properties[key]
    if (!rule || value === undefined || value === null) continue
    if (rule.type === 'string' && typeof value !== 'string') throw new Error(`${key} debe ser texto.`)
    if (rule.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`${key} debe ser un número.`)
    if (rule.type === 'integer' && (!Number.isInteger(value))) throw new Error(`${key} debe ser un entero.`)
    if (rule.enum && !rule.enum.includes(value)) throw new Error(`${key} contiene una opción no permitida.`)
    if (typeof value === 'number') {
      if (rule.minimum !== undefined && value < rule.minimum) throw new Error(`${key} debe ser mayor o igual que ${rule.minimum}.`)
      if (rule.maximum !== undefined && value > rule.maximum) throw new Error(`${key} debe ser menor o igual que ${rule.maximum}.`)
      if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) throw new Error(`${key} debe ser mayor que ${rule.exclusiveMinimum}.`)
    }
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.trim().length < rule.minLength) throw new Error(`${key} debe tener al menos ${rule.minLength} caracteres.`)
      if (rule.maxLength !== undefined && value.length > rule.maxLength) throw new Error(`${key} no puede superar ${rule.maxLength} caracteres.`)
      if (rule.format === 'date') isoDate(value)
    }
  }
  return rawArguments
}

function resolveDatabasePath({ app, resourcePath, argv }) {
  const explicit = argv.find(arg => arg.startsWith('--db='))?.slice(5) || process.env.CAFETAL_OS_DB
  if (explicit) return path.resolve(explicit)

  const demo = argv.includes('--demo') || process.env.CAFETAL_OS_MODE === 'demo'
  const runtimeName = demo ? 'cafetal-os-demo-runtime.db' : 'cafetal-os.db'
  const runtimePath = path.join(app.getPath('userData'), runtimeName)
  if (fs.existsSync(runtimePath)) return runtimePath

  const templateName = demo ? 'cafetal-os-demo.db' : 'cafetal-os.db'
  const templatePath = resourcePath('database', templateName)
  if (fs.existsSync(templatePath)) {
    fs.mkdirSync(path.dirname(runtimePath), { recursive: true })
    fs.copyFileSync(templatePath, runtimePath)
    return runtimePath
  }
  return templatePath
}

class McpDatabase {
  constructor(filePath, writable = false) {
    this.filePath = filePath
    this.writable = writable
    this.db = null
  }

  async open() {
    if (!fs.existsSync(this.filePath)) throw new Error(`No se encontró la base de datos: ${this.filePath}`)
    const SQL = await initSqlJs()
    this.db = new SQL.Database(fs.readFileSync(this.filePath))
  }

  query(sql, params = []) {
    const stmt = this.db.prepare(sql)
    if (params.length) stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  }

  get(sql, params = []) {
    return this.query(sql, params)[0] || null
  }

  run(sql, params = []) {
    if (!this.writable) throw new Error('La escritura MCP está deshabilitada. Inicie con --write de forma explícita.')
    this.db.run(sql, params)
    const result = this.get('SELECT last_insert_rowid() AS id')
    this.persist()
    return { id: result?.id || null }
  }

  persist() {
    if (!this.writable) return
    fs.writeFileSync(this.filePath, Buffer.from(this.db.export()))
  }

  close() {
    this.db?.close()
    this.db = null
  }
}

function configMap(database) {
  return Object.fromEntries(database.query('SELECT clave, valor FROM configuracion').map(row => [row.clave, row.valor]))
}

function fincaResumen(database) {
  const finca = database.get('SELECT * FROM finca WHERE activo = 1 LIMIT 1') || {}
  const lotes = database.get(`SELECT COUNT(*) AS total_lotes, COALESCE(SUM(area_mz),0) AS area_lotes,
    COALESCE(SUM(CASE WHEN estado='produccion' THEN 1 ELSE 0 END),0) AS lotes_produccion
    FROM lotes WHERE activo = 1 AND COALESCE(es_sistema,0)=0`) || {}
  const cosecha = database.get(`SELECT COALESCE(SUM(latas_recolectadas),0) AS latas,
    COALESCE(SUM(kilos_estimados),0) AS kilos, COALESCE(SUM(total_pagado),0) AS pagado
    FROM recoleccion WHERE fecha >= ? AND fecha <= ?`, [startOfYear(), today()]) || {}
  const inventario = database.query(`SELECT tipo_producto,
    ROUND(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_qq ELSE -cantidad_qq END),2) AS existencias_qq
    FROM inventario GROUP BY tipo_producto ORDER BY tipo_producto`)
  const alertas = database.get('SELECT COUNT(*) AS activas FROM alertas_fitosanitarias WHERE activa = 1') || {}
  return { finca, lotes, cosecha_anual: cosecha, inventario, alertas_activas: alertas.activas || 0 }
}

function toolDefinitions(writable) {
  const tools = [
    {
      name: 'cafetal_resumen_general',
      title: 'Resumen general de la finca',
      description: 'Devuelve una radiografía operativa de finca, lotes, cosecha anual, inventario y alertas activas.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'cafetal_listar_lotes',
      title: 'Listar lotes',
      description: 'Consulta lotes activos con variedad, área, altitud, estado y producción acumulada.',
      inputSchema: {
        type: 'object',
        properties: {
          estado: { type: 'string', enum: ['produccion', 'reposicion', 'descanso', 'nuevo'] },
          buscar: { type: 'string', description: 'Texto contenido en código, variedad o tipo de suelo.' },
          limite: { type: 'integer', minimum: 1, maximum: 200, default: 50 }
        }, additionalProperties: false
      }
    },
    {
      name: 'cafetal_analizar_lote',
      title: 'Analizar un lote',
      description: 'Integra ficha agronómica, cosecha, beneficio, costos, inventario, calidad y alertas de un lote.',
      inputSchema: { type: 'object', required: ['lote_id'], properties: { lote_id: { type: 'integer', minimum: 1 } }, additionalProperties: false }
    },
    {
      name: 'cafetal_resumen_cosecha',
      title: 'Resumen de cosecha',
      description: 'Resume cosecha por período, lotes y recolectores, con latas, kilos y pagos.',
      inputSchema: {
        type: 'object', properties: {
          fecha_inicio: { type: 'string', format: 'date' }, fecha_fin: { type: 'string', format: 'date' },
          lote_id: { type: 'integer', minimum: 1 }
        }, additionalProperties: false
      }
    },
    {
      name: 'cafetal_resumen_beneficio',
      title: 'Resumen de beneficio',
      description: 'Analiza procesos de beneficio, rendimiento cereza a pergamino, humedad y fermentación por período.',
      inputSchema: {
        type: 'object', properties: {
          fecha_inicio: { type: 'string', format: 'date' }, fecha_fin: { type: 'string', format: 'date' },
          lote_id: { type: 'integer', minimum: 1 }
        }, additionalProperties: false
      }
    },
    {
      name: 'cafetal_inventario_actual',
      title: 'Inventario actual',
      description: 'Calcula existencias por tipo de café y detecta saldos negativos o movimientos recientes.',
      inputSchema: { type: 'object', properties: { tipo_producto: { type: 'string', enum: ['cereza','pergamino_humedo','pergamino_seco','verde','tostado'] } }, additionalProperties: false }
    },
    {
      name: 'cafetal_resumen_financiero',
      title: 'Resumen financiero',
      description: 'Calcula ingresos por ventas, gastos, pagos de cosecha, utilidad y rentabilidad para un período.',
      inputSchema: {
        type: 'object', properties: {
          fecha_inicio: { type: 'string', format: 'date' }, fecha_fin: { type: 'string', format: 'date' },
          lote_id: { type: 'integer', minimum: 1 }
        }, additionalProperties: false
      }
    },
    {
      name: 'cafetal_alertas_operativas',
      title: 'Alertas operativas',
      description: 'Detecta alertas fitosanitarias, certificaciones por vencer, humedad fuera de rango, rendimientos atípicos e inventario negativo.',
      inputSchema: { type: 'object', properties: { dias_certificacion: { type: 'integer', minimum: 1, maximum: 365, default: 90 } }, additionalProperties: false }
    },
    {
      name: 'cafetal_calidad_resumen',
      title: 'Resumen de calidad',
      description: 'Resume puntajes SCA, atributos de taza y desempeño por lote.',
      inputSchema: { type: 'object', properties: { lote_id: { type: 'integer', minimum: 1 }, limite: { type: 'integer', minimum: 1, maximum: 100, default: 30 } }, additionalProperties: false }
    },
    {
      name: 'cafetal_trazabilidad_lote',
      title: 'Trazabilidad de lote',
      description: 'Devuelve el código de trazabilidad y la cadena de bloques operativos asociada a un lote.',
      inputSchema: { type: 'object', required: ['lote_id'], properties: { lote_id: { type: 'integer', minimum: 1 } }, additionalProperties: false }
    },
    {
      name: 'cafetal_contexto_reporte',
      title: 'Contexto para reporte',
      description: 'Entrega un paquete estructurado para que la IA redacte un informe técnico o gerencial sin consultar tablas arbitrarias.',
      inputSchema: {
        type: 'object', properties: {
          fecha_inicio: { type: 'string', format: 'date' }, fecha_fin: { type: 'string', format: 'date' },
          enfoque: { type: 'string', enum: ['gerencial', 'productivo', 'calidad', 'sostenibilidad', 'financiero'], default: 'gerencial' }
        }, additionalProperties: false
      }
    },
    {
      name: 'cafetal_configuracion_reportes',
      title: 'Configuración de reportes',
      description: 'Consulta el membrete y los datos institucionales configurados para PDFs.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'cafetal_planillas_corte',
      title: 'Planillas semanales de corte',
      description: 'Resume cuadrillas, cantidades y pagos por semana, lote y cortador.',
      inputSchema: { type: 'object', properties: {
        semana_inicio: { type: 'string', format: 'date' }, lote_id: { type: 'integer', minimum: 1 }, limite: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
      }, additionalProperties: false }
    },
    {
      name: 'cafetal_resumen_compras',
      title: 'Resumen de compras y acopio',
      description: 'Analiza café adquirido a terceros por proveedor, estado físico, calidad, peso y costo.',
      inputSchema: { type: 'object', properties: {
        fecha_inicio: { type: 'string', format: 'date' }, fecha_fin: { type: 'string', format: 'date' },
        tipo_producto: { type: 'string', enum: ['cereza','pergamino_humedo','pergamino_seco','verde','tostado'] },
        estado_calidad: { type: 'string', enum: ['pendiente','aprobado','condicionado','rechazado'] }, limite: { type: 'integer', minimum: 1, maximum: 200, default: 50 }
      }, additionalProperties: false }
    }
  ]

  if (writable) {
    tools.push(
      {
        name: 'cafetal_registrar_gasto', title: 'Registrar gasto',
        description: 'Registra un gasto validado. Solo aparece cuando el servidor se inicia con --write.',
        inputSchema: { type: 'object', required: ['fecha','categoria','descripcion','costo_total'], properties: {
          fecha: { type: 'string', format: 'date' }, categoria: { type: 'string', enum: ['fertilizante','fungicida','herbicida','mano_obra','transporte','insumos','maquinaria','mantenimiento','servicios','otros'] },
          descripcion: { type: 'string', minLength: 3 }, costo_total: { type: 'number', exclusiveMinimum: 0 }, lote_id: { type: 'integer', minimum: 1 }, proveedor: { type: 'string' }, factura_comprobante: { type: 'string' }
        }, additionalProperties: false }
      },
      {
        name: 'cafetal_registrar_clima', title: 'Registrar clima',
        description: 'Registra una observación climática validada. Solo aparece con --write.',
        inputSchema: { type: 'object', required: ['fecha'], properties: {
          fecha: { type: 'string', format: 'date' }, precipitacion_mm: { type: 'number', minimum: 0 }, temp_max: { type: 'number', minimum: -10, maximum: 60 }, temp_min: { type: 'number', minimum: -10, maximum: 60 }, humedad_relativa: { type: 'number', minimum: 0, maximum: 100 }, velocidad_viento: { type: 'number', minimum: 0 }, notas: { type: 'string' }
        }, additionalProperties: false }
      },
      {
        name: 'cafetal_registrar_alerta', title: 'Registrar alerta fitosanitaria',
        description: 'Registra una alerta de roya, broca u otro riesgo. Solo aparece con --write.',
        inputSchema: { type: 'object', required: ['lote_id','tipo_alerta','nivel'], properties: {
          lote_id: { type: 'integer', minimum: 1 }, tipo_alerta: { type: 'string', enum: ['roya','broca','oteada','helada','sequia','inundacion'] }, nivel: { type: 'string', enum: ['bajo','medio','alto'] }, fecha_inicio: { type: 'string', format: 'date' }, recomendacion: { type: 'string' }
        }, additionalProperties: false }
      }
    )
  }
  return tools
}

function createHandlers(database, writable) {
  return {
    cafetal_resumen_general: () => fincaResumen(database),

    cafetal_listar_lotes: ({ estado, buscar, limite = 50 }) => {
      const clauses = ['l.activo = 1', 'COALESCE(l.es_sistema,0)=0']
      const params = []
      if (estado) { clauses.push('l.estado = ?'); params.push(estado) }
      if (buscar) { clauses.push('(l.codigo LIKE ? OR v.nombre LIKE ? OR l.tipo_suelo LIKE ?)'); params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`) }
      params.push(Math.min(Math.max(asNumber(limite, 50), 1), 200))
      return database.query(`SELECT l.id,l.codigo,l.area_mz,l.año_siembra,l.altitud_lote_msnm,l.estado,l.tipo_suelo,v.nombre AS variedad,
        COALESCE(SUM(r.latas_recolectadas),0) AS latas_acumuladas, COALESCE(SUM(r.kilos_estimados),0) AS kilos_acumulados
        FROM lotes l LEFT JOIN variedades v ON v.id=l.variedad_id LEFT JOIN recoleccion r ON r.lote_id=l.id
        WHERE ${clauses.join(' AND ')} GROUP BY l.id ORDER BY l.codigo LIMIT ?`, params)
    },

    cafetal_analizar_lote: ({ lote_id }) => {
      const lote = database.get(`SELECT l.*,v.nombre AS variedad FROM lotes l LEFT JOIN variedades v ON v.id=l.variedad_id WHERE l.id=?`, [lote_id])
      if (!lote) throw new Error(`No existe el lote ${lote_id}.`)
      const cosecha = database.get(`SELECT COUNT(*) AS cortes,COALESCE(SUM(latas_recolectadas),0) AS latas,COALESCE(SUM(kilos_estimados),0) AS kilos,COALESCE(SUM(total_pagado),0) AS pagado FROM recoleccion WHERE lote_id=?`, [lote_id])
      const beneficio = database.get(`SELECT COUNT(*) AS procesos,COALESCE(SUM(kilos_cereza_ingresados),0) AS cereza,COALESCE(SUM(kilos_pergamino_seco),0) AS pergamino,ROUND(AVG(rendimiento_porcentaje),2) AS rendimiento_promedio,ROUND(AVG(humedad_final_porcentaje),2) AS humedad_promedio FROM beneficio WHERE lote_id=?`, [lote_id])
      const gastos = database.get(`SELECT COALESCE(SUM(costo_total),0) AS total FROM gastos WHERE lote_id=?`, [lote_id])
      const calidad = database.get(`SELECT COUNT(*) AS evaluaciones,ROUND(AVG(puntaje_sca),2) AS sca_promedio,MAX(puntaje_sca) AS mejor_sca FROM calidad_evaluaciones WHERE lote_id=?`, [lote_id])
      const alertas = database.query(`SELECT tipo_alerta,nivel,fecha_inicio,recomendacion FROM alertas_fitosanitarias WHERE lote_id=? AND activa=1 ORDER BY nivel DESC`, [lote_id])
      const inventario = database.query(`SELECT tipo_producto,ROUND(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_qq ELSE -cantidad_qq END),2) AS qq FROM inventario WHERE lote_id=? GROUP BY tipo_producto`, [lote_id])
      return { lote, cosecha, beneficio, gastos, calidad, alertas, inventario }
    },

    cafetal_resumen_cosecha: ({ fecha_inicio, fecha_fin, lote_id }) => {
      const { start, end } = dateRange(fecha_inicio, fecha_fin)
      const extra = lote_id ? ' AND r.lote_id=?' : ''
      const params = lote_id ? [start, end, lote_id] : [start, end]
      const totales = database.get(`SELECT COUNT(*) AS cortes,COALESCE(SUM(latas_recolectadas),0) AS latas,COALESCE(SUM(kilos_estimados),0) AS kilos,COALESCE(SUM(total_pagado),0) AS pagado FROM recoleccion r WHERE fecha BETWEEN ? AND ?${extra}`, params)
      const porLote = database.query(`SELECT l.id,l.codigo,COUNT(*) AS cortes,ROUND(SUM(r.latas_recolectadas),2) AS latas,ROUND(SUM(r.kilos_estimados),2) AS kilos,ROUND(SUM(r.total_pagado),2) AS pagado FROM recoleccion r JOIN lotes l ON l.id=r.lote_id WHERE r.fecha BETWEEN ? AND ?${extra} GROUP BY l.id ORDER BY kilos DESC`, params)
      const recolectores = database.query(`SELECT p.id,p.nombre_completo,COUNT(*) AS cortes,ROUND(SUM(r.latas_recolectadas),2) AS latas,ROUND(SUM(r.kilos_estimados),2) AS kilos FROM recoleccion r JOIN recolectores p ON p.id=r.recolector_id WHERE r.fecha BETWEEN ? AND ?${extra} GROUP BY p.id ORDER BY kilos DESC LIMIT 20`, params)
      return { periodo: { fecha_inicio: start, fecha_fin: end }, totales, por_lote: porLote, recolectores }
    },

    cafetal_resumen_beneficio: ({ fecha_inicio, fecha_fin, lote_id }) => {
      const { start, end } = dateRange(fecha_inicio, fecha_fin)
      const extra = lote_id ? ' AND b.lote_id=?' : ''
      const params = lote_id ? [start, end, lote_id] : [start, end]
      const resumen = database.get(`SELECT COUNT(*) AS procesos,ROUND(SUM(kilos_cereza_ingresados),2) AS kilos_cereza,ROUND(SUM(kilos_pergamino_seco),2) AS kilos_pergamino,ROUND(AVG(rendimiento_porcentaje),2) AS rendimiento_promedio,ROUND(AVG(humedad_final_porcentaje),2) AS humedad_promedio,ROUND(AVG(horas_fermentacion),2) AS fermentacion_promedio FROM beneficio b WHERE fecha_inicio BETWEEN ? AND ?${extra}`, params)
      const porLote = database.query(`SELECT l.id,l.codigo,COUNT(*) AS procesos,ROUND(SUM(b.kilos_cereza_ingresados),2) AS cereza,ROUND(SUM(b.kilos_pergamino_seco),2) AS pergamino,ROUND(AVG(b.rendimiento_porcentaje),2) AS rendimiento,ROUND(AVG(b.humedad_final_porcentaje),2) AS humedad FROM beneficio b JOIN lotes l ON l.id=b.lote_id WHERE b.fecha_inicio BETWEEN ? AND ?${extra} GROUP BY l.id ORDER BY pergamino DESC`, params)
      return { periodo: { fecha_inicio: start, fecha_fin: end }, resumen, por_lote: porLote }
    },

    cafetal_inventario_actual: ({ tipo_producto }) => {
      const clause = tipo_producto ? ' WHERE tipo_producto=?' : ''
      const params = tipo_producto ? [tipo_producto] : []
      const existencias = database.query(`SELECT tipo_producto,ROUND(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_qq ELSE -cantidad_qq END),2) AS existencias_qq,ROUND(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_kg ELSE -cantidad_kg END),2) AS existencias_kg FROM inventario${clause} GROUP BY tipo_producto ORDER BY tipo_producto`, params)
      const recientes = database.query(`SELECT i.id,i.fecha_movimiento,i.tipo_producto,i.tipo_movimiento,i.cantidad_qq,i.total_venta,l.codigo AS lote FROM inventario i LEFT JOIN lotes l ON l.id=i.lote_id${tipo_producto ? ' WHERE i.tipo_producto=?' : ''} ORDER BY i.fecha_movimiento DESC,i.id DESC LIMIT 20`, params)
      return { existencias, saldos_negativos: existencias.filter(item => asNumber(item.existencias_qq) < 0), movimientos_recientes: recientes }
    },

    cafetal_resumen_financiero: ({ fecha_inicio, fecha_fin, lote_id }) => {
      const { start, end } = dateRange(fecha_inicio, fecha_fin)
      const loteInventario = lote_id ? ' AND lote_id=?' : ''; const loteGasto = lote_id ? ' AND lote_id=?' : ''
      const params = lote_id ? [start, end, lote_id] : [start, end]
      const ingresos = database.get(`SELECT COALESCE(SUM(total_venta),0) AS total FROM inventario WHERE tipo_movimiento='venta' AND fecha_movimiento BETWEEN ? AND ?${loteInventario}`, params)?.total || 0
      const gastos = database.get(`SELECT COALESCE(SUM(costo_total),0) AS total FROM gastos WHERE fecha BETWEEN ? AND ?${loteGasto}`, params)?.total || 0
      const cosecha = database.get(`SELECT COALESCE(SUM(total_pagado),0) AS total FROM recoleccion WHERE fecha BETWEEN ? AND ?${loteGasto}`, params)?.total || 0
      const costos = asNumber(gastos) + asNumber(cosecha); const utilidad = asNumber(ingresos) - costos
      return { periodo: { fecha_inicio: start, fecha_fin: end }, ingresos: asNumber(ingresos), gastos: asNumber(gastos), pagos_cosecha: asNumber(cosecha), costos_totales: costos, utilidad, rentabilidad_porcentaje: ingresos > 0 ? Math.round((utilidad / ingresos) * 10000) / 100 : 0 }
    },

    cafetal_alertas_operativas: ({ dias_certificacion = 90 }) => {
      const certLimit = new Date(); certLimit.setDate(certLimit.getDate() + asNumber(dias_certificacion, 90))
      const certificaciones = database.query(`SELECT tipo,entidad_certificadora,fecha_vencimiento FROM certificaciones WHERE activo=1 AND fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= ? ORDER BY fecha_vencimiento`, [certLimit.toISOString().slice(0,10)])
      const fitosanitarias = database.query(`SELECT a.*,l.codigo AS lote FROM alertas_fitosanitarias a LEFT JOIN lotes l ON l.id=a.lote_id WHERE a.activa=1 ORDER BY CASE a.nivel WHEN 'alto' THEN 1 WHEN 'medio' THEN 2 ELSE 3 END,a.fecha_inicio`)
      const beneficio = database.query(`SELECT b.id,l.codigo AS lote,b.fecha_inicio,b.rendimiento_porcentaje,b.humedad_final_porcentaje FROM beneficio b JOIN lotes l ON l.id=b.lote_id WHERE (b.humedad_final_porcentaje IS NOT NULL AND (b.humedad_final_porcentaje < 9 OR b.humedad_final_porcentaje > 13)) OR (b.rendimiento_porcentaje IS NOT NULL AND (b.rendimiento_porcentaje < 12 OR b.rendimiento_porcentaje > 35)) ORDER BY b.fecha_inicio DESC LIMIT 30`)
      const inventario = database.query(`SELECT tipo_producto,ROUND(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_qq ELSE -cantidad_qq END),2) AS saldo FROM inventario GROUP BY tipo_producto HAVING saldo < 0`)
      return { fitosanitarias, certificaciones_por_vencer: certificaciones, procesos_fuera_de_rango: beneficio, inventario_negativo: inventario, total: fitosanitarias.length + certificaciones.length + beneficio.length + inventario.length }
    },

    cafetal_calidad_resumen: ({ lote_id, limite = 30 }) => {
      const clause = lote_id ? ' WHERE c.lote_id=?' : ''
      const params = lote_id ? [lote_id, Math.min(asNumber(limite, 30),100)] : [Math.min(asNumber(limite,30),100)]
      const detalle = database.query(`SELECT c.*,l.codigo AS lote FROM calidad_evaluaciones c LEFT JOIN lotes l ON l.id=c.lote_id${clause} ORDER BY c.fecha DESC LIMIT ?`, params)
      const resumen = database.get(`SELECT COUNT(*) AS evaluaciones,ROUND(AVG(puntaje_sca),2) AS sca_promedio,MAX(puntaje_sca) AS mejor_sca,ROUND(AVG(fragancia),2) AS fragancia,ROUND(AVG(sabor),2) AS sabor,ROUND(AVG(acidez),2) AS acidez,ROUND(AVG(cuerpo),2) AS cuerpo FROM calidad_evaluaciones c${clause}`, lote_id ? [lote_id] : [])
      return { resumen, detalle }
    },

    cafetal_trazabilidad_lote: ({ lote_id }) => {
      const origen = database.get('SELECT * FROM lotes_origen WHERE lote_id=?', [lote_id])
      const bloques = database.query(`SELECT * FROM bloques_trazabilidad WHERE
        (tipo_registro='lote' AND registro_id=?) OR
        (tipo_registro='cosecha' AND registro_id IN (SELECT id FROM recoleccion WHERE lote_id=?)) OR
        (tipo_registro='beneficio' AND registro_id IN (SELECT id FROM beneficio WHERE lote_id=?)) OR
        (tipo_registro='inventario' AND registro_id IN (SELECT id FROM inventario WHERE lote_id=?))
        ORDER BY timestamp`, [lote_id,lote_id,lote_id,lote_id])
      return { lote_id, origen, bloques, completa: Boolean(origen && bloques.length) }
    },

    cafetal_contexto_reporte: ({ fecha_inicio, fecha_fin, enfoque = 'gerencial' }) => {
      const { start, end } = dateRange(fecha_inicio, fecha_fin)
      const base = { enfoque, periodo: { fecha_inicio: start, fecha_fin: end }, generado_en: new Date().toISOString(), resumen_general: fincaResumen(database) }
      const handlers = createHandlers(database, writable)
      if (['gerencial','productivo'].includes(enfoque)) {
        base.cosecha = handlers.cafetal_resumen_cosecha({ fecha_inicio: start, fecha_fin: end })
        base.beneficio = handlers.cafetal_resumen_beneficio({ fecha_inicio: start, fecha_fin: end })
      }
      if (['gerencial','financiero'].includes(enfoque)) base.finanzas = handlers.cafetal_resumen_financiero({ fecha_inicio: start, fecha_fin: end })
      if (enfoque === 'calidad') base.calidad = handlers.cafetal_calidad_resumen({ limite: 100 })
      if (enfoque === 'sostenibilidad') {
        base.huella = database.get(`SELECT COUNT(*) AS registros,ROUND(COALESCE(SUM(co2e_kg),0),2) AS co2e_kg FROM huella_carbono WHERE fecha BETWEEN ? AND ?`, [start,end])
        base.practicas = database.query('SELECT tipo_practica,COUNT(*) AS total,ROUND(SUM(area_mz),2) AS area_mz FROM practicas_regenerativas WHERE activo=1 GROUP BY tipo_practica')
      }
      base.alertas = handlers.cafetal_alertas_operativas({ dias_certificacion: 90 })
      return base
    },

    cafetal_configuracion_reportes: () => {
      const config = configMap(database)
      return Object.fromEntries(Object.entries(config).filter(([key]) => key.startsWith('reporte_') || key.startsWith('moneda_') || key.startsWith('unidad_')))
    },

    cafetal_planillas_corte: ({ semana_inicio, lote_id, limite = 20 }) => {
      const clauses = ['1=1']
      const params = []
      if (semana_inicio) { clauses.push('p.semana_inicio = ?'); params.push(semana_inicio) }
      if (lote_id) { clauses.push('p.lote_id = ?'); params.push(lote_id) }
      params.push(Math.min(Math.max(asNumber(limite, 20), 1), 100))
      const planillas = database.query(`SELECT p.id,p.semana_inicio,p.semana_fin,p.unidad,p.precio_por_unidad,p.estado,l.codigo AS lote,
        ROUND(COALESCE(SUM(r.cantidad_unidad),0),2) AS cantidad,ROUND(COALESCE(SUM(r.kilos_estimados),0),2) AS kilos,
        ROUND(COALESCE(SUM(r.total_pagado),0),2) AS pagado,COUNT(DISTINCT r.recolector_id) AS cortadores
        FROM planillas_corte p JOIN lotes l ON l.id=p.lote_id LEFT JOIN recoleccion r ON r.planilla_id=p.id
        WHERE ${clauses.join(' AND ')} GROUP BY p.id ORDER BY p.semana_inicio DESC,p.id DESC LIMIT ?`, params)
      const detail = planillas[0] ? database.query(`SELECT rec.nombre_completo,r.fecha,r.cantidad_unidad,r.unidad_corte,r.kilos_estimados,r.total_pagado
        FROM recoleccion r LEFT JOIN recolectores rec ON rec.id=r.recolector_id WHERE r.planilla_id=? ORDER BY rec.nombre_completo,r.fecha`, [planillas[0].id]) : []
      return { planillas, detalle_primera_planilla: detail }
    },

    cafetal_resumen_compras: ({ fecha_inicio, fecha_fin, tipo_producto, estado_calidad, limite = 50 }) => {
      const { start, end } = dateRange(fecha_inicio, fecha_fin)
      const clauses = ['c.fecha BETWEEN ? AND ?']
      const params = [start, end]
      if (tipo_producto) { clauses.push('c.tipo_producto=?'); params.push(tipo_producto) }
      if (estado_calidad) { clauses.push('c.estado_calidad=?'); params.push(estado_calidad) }
      const totals = database.get(`SELECT COUNT(*) AS compras,ROUND(COALESCE(SUM(c.cantidad_kg),0),2) AS kg,
        ROUND(COALESCE(SUM(c.cantidad_qq),0),2) AS qq,ROUND(COALESCE(SUM(c.costo_total),0),2) AS costo_total,
        ROUND(AVG(c.humedad_porcentaje),2) AS humedad_promedio FROM compras_cafe c WHERE ${clauses.join(' AND ')}`, params)
      const byProduct = database.query(`SELECT c.tipo_producto,c.estado_calidad,COUNT(*) AS compras,ROUND(SUM(c.cantidad_kg),2) AS kg,
        ROUND(SUM(c.costo_total),2) AS costo_total FROM compras_cafe c WHERE ${clauses.join(' AND ')} GROUP BY c.tipo_producto,c.estado_calidad ORDER BY c.tipo_producto,c.estado_calidad`, params)
      const detailParams = [...params, Math.min(Math.max(asNumber(limite, 50), 1), 200)]
      const detail = database.query(`SELECT c.codigo,c.fecha,c.tipo_producto,c.cantidad_kg,c.cantidad_qq,c.costo_total,c.humedad_porcentaje,c.defectos_porcentaje,
        c.estado_calidad,c.origen_geografico,p.nombre AS proveedor FROM compras_cafe c JOIN proveedores_cafe p ON p.id=c.proveedor_id
        WHERE ${clauses.join(' AND ')} ORDER BY c.fecha DESC,c.id DESC LIMIT ?`, detailParams)
      return { periodo: { inicio: start, fin: end }, totales: totals, por_producto_y_calidad: byProduct, compras: detail }
    },

    cafetal_registrar_gasto: (args) => {
      if (!writable) throw new Error('Escritura no habilitada.')
      const normalized = validateEntity('gasto', { ...args, cantidad: 1, costo_unitario: args.costo_total })
      if (normalized.lote_id) {
        const lote = database.get('SELECT id FROM lotes WHERE id=? AND activo=1', [normalized.lote_id])
        if (!lote) throw new Error('El lote indicado no existe o está inactivo.')
      }
      return database.run(`INSERT INTO gastos (lote_id,fecha,categoria,descripcion,cantidad,costo_unitario,costo_total,proveedor,factura_comprobante) VALUES (?,?,?,?,?,?,?,?,?)`, [normalized.lote_id || null,normalized.fecha,normalized.categoria,normalized.descripcion,normalized.cantidad,normalized.costo_unitario,normalized.costo_total,args.proveedor || null,args.factura_comprobante || null])
    },

    cafetal_registrar_clima: (args) => {
      if (!writable) throw new Error('Escritura no habilitada.')
      const normalized = validateEntity('clima', args)
      return database.run(`INSERT INTO registros_clima (fecha,precipitacion_mm,temp_max,temp_min,humedad_relativa,velocidad_viento,fuente,notas) VALUES (?,?,?,?,?,?,?,?)`, [normalized.fecha,normalized.precipitacion_mm,normalized.temp_max,normalized.temp_min,normalized.humedad_relativa,normalized.velocidad_viento,'MCP local',args.notas || null])
    },

    cafetal_registrar_alerta: (args) => {
      if (!writable) throw new Error('Escritura no habilitada.')
      const normalized = validateEntity('alerta', args)
      const lote = database.get('SELECT id FROM lotes WHERE id=? AND activo=1',[normalized.lote_id])
      if (!lote) throw new Error('El lote indicado no existe o está inactivo.')
      return database.run(`INSERT INTO alertas_fitosanitarias (lote_id,tipo_alerta,nivel,fecha_inicio,activa,recomendacion) VALUES (?,?,?,?,1,?)`, [normalized.lote_id,normalized.tipo_alerta,normalized.nivel,normalized.fecha_inicio,normalized.recomendacion || null])
    }
  }
}

function resources() {
  return [
    { uri: 'cafetal://finca/resumen', name: 'Resumen operativo de la finca', description: 'Estado general listo para contexto de IA.', mimeType: 'application/json' },
    { uri: 'cafetal://configuracion/reportes', name: 'Configuración de membrete', description: 'Datos institucionales usados en PDFs.', mimeType: 'application/json' },
    { uri: 'cafetal://catalogo/modulos', name: 'Catálogo funcional', description: 'Módulos y propósito de Cafetal OS.', mimeType: 'application/json' },
    { uri: 'cafetal://operacion/acopio', name: 'Resumen de acopio', description: 'Compras de café y planillas de corte recientes.', mimeType: 'application/json' }
  ]
}

function readResource(database, uri) {
  if (uri === 'cafetal://finca/resumen') return fincaResumen(database)
  if (uri === 'cafetal://configuracion/reportes') {
    const config = configMap(database)
    return Object.fromEntries(Object.entries(config).filter(([key]) => key.startsWith('reporte_')))
  }
  if (uri === 'cafetal://catalogo/modulos') return {
    modulos: ['finca','lotes','cosecha','planillas_corte','compras','beneficio','inventario','gastos','reportes','sostenibilidad','calidad','trazabilidad','clima','mercado','marketing','educacion'],
    principio: 'Datos locales, control del productor y operación offline-first.'
  }
  if (uri === 'cafetal://operacion/acopio') {
    const handlers = createHandlers(database, false)
    return { compras: handlers.cafetal_resumen_compras({ fecha_inicio: startOfYear(), fecha_fin: today(), limite: 10 }), planillas: handlers.cafetal_planillas_corte({ limite: 10 }) }
  }
  throw new Error(`Recurso desconocido: ${uri}`)
}

function promptDefinitions() {
  return [
    { name: 'diagnostico_finca', title: 'Diagnóstico integral de finca', description: 'Analiza la situación productiva y prioriza acciones.', arguments: [{ name: 'objetivo', description: 'Objetivo del productor.', required: false }] },
    { name: 'analisis_temporada', title: 'Análisis de temporada', description: 'Construye un cierre productivo y financiero.', arguments: [{ name: 'fecha_inicio', required: false }, { name: 'fecha_fin', required: false }] },
    { name: 'plan_accion_lote', title: 'Plan de acción por lote', description: 'Propone acciones a partir del historial de un lote.', arguments: [{ name: 'lote_id', required: true }] }
  ]
}

function getPrompt(name, args = {}) {
  if (name === 'diagnostico_finca') return [{ role: 'user', content: { type: 'text', text: `Usa las tools de Cafetal OS para elaborar un diagnóstico integral de la finca. Objetivo: ${args.objetivo || 'mejorar productividad, calidad y rentabilidad'}. Separa hechos, inferencias, riesgos y acciones priorizadas. No inventes datos faltantes.` } }]
  if (name === 'analisis_temporada') return [{ role: 'user', content: { type: 'text', text: `Consulta cafetal_contexto_reporte para el período ${args.fecha_inicio || 'inicio del año'} a ${args.fecha_fin || 'hoy'} con enfoque gerencial. Redacta un cierre de temporada con indicadores, desviaciones y recomendaciones verificables.` } }]
  if (name === 'plan_accion_lote') return [{ role: 'user', content: { type: 'text', text: `Consulta cafetal_analizar_lote con lote_id ${args.lote_id}. Genera un plan de acción agronómico y operativo, diferenciando acciones inmediatas, próximas y de seguimiento. Señala cualquier supuesto.` } }]
  throw new Error(`Prompt desconocido: ${name}`)
}

function responseResult(id, result) { return JSON.stringify({ jsonrpc: '2.0', id, result }) }
function responseError(id, code, message, data) { return JSON.stringify({ jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data ? { data } : {}) } }) }

export async function startMcpServer({ app, resourcePath, argv = process.argv }) {
  const writable = argv.includes('--write') || process.env.CAFETAL_OS_MCP_WRITE === 'true'
  const filePath = resolveDatabasePath({ app, resourcePath, argv })
  const database = new McpDatabase(filePath, writable)
  await database.open()
  const schemaPath = resourcePath('database', 'schema.sql')
  if (fs.existsSync(schemaPath)) database.db.exec(fs.readFileSync(schemaPath, 'utf8'))
  const tools = toolDefinitions(writable)
  const handlers = createHandlers(database, writable)
  stderr(`Servidor stdio iniciado en modo ${writable ? 'lectura/escritura' : 'solo lectura'}.`)
  stderr(`Base: ${filePath}`)

  process.stdout.on('error', error => {
    if (error.code === 'EPIPE') {
      database.close()
      process.exit(0)
    }
    stderr(`Error de salida stdio: ${error.message}`)
  })

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false })
  rl.on('line', async line => {
    if (!line.trim()) return
    let request
    try { request = JSON.parse(line) } catch (error) {
      process.stdout.write(responseError(null, -32700, 'JSON inválido', error.message) + '\n')
      return
    }
    if (!Object.prototype.hasOwnProperty.call(request, 'id')) return
    try {
      let result
      switch (request.method) {
        case 'initialize': {
          const requestedVersion = request.params?.protocolVersion
          const negotiatedVersion = SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion) ? requestedVersion : PROTOCOL_VERSION
          result = { protocolVersion: negotiatedVersion, capabilities: { tools: {}, resources: {}, prompts: {} }, serverInfo: { name: SERVER_NAME, title: 'Cafetal OS MCP local', version: app.getVersion() }, instructions: 'Servidor local para consultar datos cafetaleros. Las tools de escritura solo se exponen con --write.' }
          break
        }
        case 'ping': result = {}; break
        case 'tools/list': result = { tools }; break
        case 'tools/call': {
          const name = request.params?.name
          const handler = handlers[name]
          const definition = tools.find(tool => tool.name === name)
          if (!handler || !definition) throw new Error(`Tool desconocida: ${name}`)
          try {
            const toolArguments = validateToolArguments(definition, request.params?.arguments || {})
            const data = await handler(toolArguments)
            result = { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data }
          } catch (error) {
            result = { content: [{ type: 'text', text: error.message }], isError: true }
          }
          break
        }
        case 'resources/list': result = { resources: resources() }; break
        case 'resources/read': {
          const uri = request.params?.uri
          const data = readResource(database, uri)
          result = { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] }
          break
        }
        case 'prompts/list': result = { prompts: promptDefinitions() }; break
        case 'prompts/get': result = { description: promptDefinitions().find(p => p.name === request.params?.name)?.description || '', messages: getPrompt(request.params?.name, request.params?.arguments || {}) }; break
        case 'logging/setLevel': result = {}; break
        default: process.stdout.write(responseError(request.id, -32601, `Método no soportado: ${request.method}`) + '\n'); return
      }
      process.stdout.write(responseResult(request.id, result) + '\n')
    } catch (error) {
      process.stdout.write(responseError(request.id, -32000, error.message) + '\n')
    }
  })

  const shutdown = () => { database.close(); process.exit(0) }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  rl.on('close', shutdown)
}

export const __mcpTest = { toolDefinitions, createHandlers, resolveDatabasePath, fincaResumen, McpDatabase, validateToolArguments, dateRange }
