const todayText = () => new Date().toISOString().slice(0, 10)

function number(value, field, { min = -Infinity, max = Infinity, required = false } = {}) {
  if (value === '' || value === null || value === undefined) {
    if (required) throw new Error(`${field} es obligatorio.`)
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} debe ser un número válido.`)
  if (parsed < min || parsed > max) throw new Error(`${field} debe estar entre ${min} y ${max}.`)
  return parsed
}

function text(value, field, { required = false, min = 0, max = 500 } = {}) {
  const normalized = String(value ?? '').trim()
  if (required && !normalized) throw new Error(`${field} es obligatorio.`)
  if (normalized && normalized.length < min) throw new Error(`${field} debe tener al menos ${min} caracteres.`)
  if (normalized.length > max) throw new Error(`${field} no puede superar ${max} caracteres.`)
  return normalized || null
}

function date(value, field, { required = false, future = true } = {}) {
  if (!value) {
    if (required) throw new Error(`${field} es obligatoria.`)
    return null
  }
  const normalized = String(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00`))) {
    throw new Error(`${field} no es una fecha válida.`)
  }
  if (!future && normalized > todayText()) throw new Error(`${field} no puede estar en el futuro.`)
  return normalized
}

function enumValue(value, field, allowed) {
  if (!allowed.includes(value)) throw new Error(`${field} contiene una opción no permitida.`)
  return value
}

export function validateEntity(entity, raw = {}) {
  const data = { ...raw }
  switch (entity) {
    case 'finca':
      data.nombre = text(data.nombre, 'Nombre de la finca', { required: true, min: 2, max: 120 })
      data.ubicacion = text(data.ubicacion, 'Ubicación', { max: 180 })
      data.altitud_msnm = number(data.altitud_msnm, 'Altitud', { min: 0, max: 3500 })
      data.area_total_mz = number(data.area_total_mz, 'Área total', { min: 0, max: 100000 })
      data.area_cafe_mz = number(data.area_cafe_mz, 'Área de café', { min: 0, max: 100000 })
      if (data.area_total_mz != null && data.area_cafe_mz != null && data.area_cafe_mz > data.area_total_mz) throw new Error('El área de café no puede superar el área total de la finca.')
      return data
    case 'lote':
      data.codigo = text(data.codigo, 'Código del lote', { required: true, min: 2, max: 40 })
      data.area_mz = number(data.area_mz, 'Área del lote', { required: true, min: 0.01, max: 10000 })
      data.año_siembra = number(data.año_siembra, 'Año de siembra', { min: 1900, max: new Date().getFullYear() + 1 })
      data.densidad_plantas_mz = number(data.densidad_plantas_mz, 'Densidad de plantas', { min: 100, max: 15000 })
      data.altitud_lote_msnm = number(data.altitud_lote_msnm, 'Altitud del lote', { min: 0, max: 3500 })
      if (data.estado) data.estado = enumValue(data.estado, 'Estado', ['produccion','reposicion','descanso','nuevo'])
      return data
    case 'cosecha':
      data.fecha = date(data.fecha, 'Fecha de cosecha', { required: true, future: false })
      data.lote_id = number(data.lote_id, 'Lote', { required: true, min: 1 })
      data.latas_recolectadas = number(data.latas_recolectadas, 'Latas recolectadas', { required: true, min: 0.01, max: 100000 })
      data.peso_lata_kg = number(data.peso_lata_kg, 'Peso por lata', { min: 1, max: 100 }) ?? 18
      data.kilos_estimados = number(data.kilos_estimados, 'Kilos estimados', { min: 0, max: 10000000 }) ?? data.latas_recolectadas * data.peso_lata_kg
      data.precio_por_lata = number(data.precio_por_lata, 'Precio por lata', { min: 0, max: 100000 }) ?? 0
      data.total_pagado = number(data.total_pagado, 'Total pagado', { min: 0, max: 100000000 }) ?? data.latas_recolectadas * data.precio_por_lata
      if (data.tipo_madurez) data.tipo_madurez = enumValue(data.tipo_madurez, 'Madurez', ['maduro','verde','pinton','sobremaduro','mixto'])
      return data
    case 'beneficio': {
      data.lote_id = number(data.lote_id, 'Lote', { required: true, min: 1 })
      data.fecha_inicio = date(data.fecha_inicio, 'Fecha de inicio', { required: true, future: false })
      data.fecha_fin = date(data.fecha_fin, 'Fecha de finalización', { future: false })
      if (data.fecha_fin && data.fecha_fin < data.fecha_inicio) throw new Error('La fecha de finalización no puede ser anterior a la fecha de inicio.')
      data.kilos_cereza_ingresados = number(data.kilos_cereza_ingresados, 'Kilos de cereza', { required: true, min: 0.01, max: 10000000 })
      data.kilos_pergamino_seco = number(data.kilos_pergamino_seco, 'Kilos de pergamino', { required: true, min: 0.01, max: 10000000 })
      if (data.kilos_pergamino_seco > data.kilos_cereza_ingresados) throw new Error('El pergamino seco no puede superar los kilos de cereza ingresados.')
      data.rendimiento_porcentaje = Math.round((data.kilos_pergamino_seco / data.kilos_cereza_ingresados) * 1000) / 10
      data.horas_fermentacion = number(data.horas_fermentacion, 'Horas de fermentación', { min: 0, max: 240 })
      data.dias_secado = number(data.dias_secado, 'Días de secado', { min: 0, max: 180 })
      data.humedad_final_porcentaje = number(data.humedad_final_porcentaje, 'Humedad final', { min: 0, max: 30 })
      if (data.metodo) data.metodo = enumValue(data.metodo, 'Método', ['lavado','honey','natural','semi-lavado'])
      if (data.tipo_secado) data.tipo_secado = enumValue(data.tipo_secado, 'Tipo de secado', ['sol','mecanico','combinado','silo'])
      return data
    }
    case 'inventario':
      data.tipo_producto = enumValue(data.tipo_producto, 'Producto', ['cereza','pergamino_humedo','pergamino_seco','verde','tostado'])
      data.tipo_movimiento = enumValue(data.tipo_movimiento, 'Movimiento', ['entrada','salida','venta'])
      data.fecha_movimiento = date(data.fecha_movimiento, 'Fecha del movimiento', { required: true, future: false })
      data.cantidad_qq = number(data.cantidad_qq, 'Cantidad', { required: true, min: 0.01, max: 1000000 })
      data.cantidad_kg = number(data.cantidad_kg, 'Cantidad en kilogramos', { min: 0, max: 46000000 }) ?? Math.round(data.cantidad_qq * 46 * 100) / 100
      data.precio_venta_qq = number(data.precio_venta_qq, 'Precio de venta', { min: 0, max: 10000000 })
      if (data.tipo_movimiento === 'venta') {
        data.cliente_destino = text(data.cliente_destino, 'Cliente', { required: true, min: 2, max: 160 })
        if (!data.precio_venta_qq) throw new Error('Una venta necesita un precio por quintal mayor que cero.')
        data.total_venta = Math.round(data.cantidad_qq * data.precio_venta_qq * 100) / 100
      }
      return data
    case 'gasto':
      data.fecha = date(data.fecha, 'Fecha del gasto', { required: true, future: false })
      data.categoria = enumValue(data.categoria, 'Categoría', ['fertilizante','fungicida','herbicida','mano_obra','transporte','insumos','maquinaria','mantenimiento','servicios','otros'])
      data.descripcion = text(data.descripcion, 'Descripción', { required: true, min: 3, max: 240 })
      data.cantidad = number(data.cantidad, 'Cantidad', { min: 0.01, max: 1000000 }) ?? 1
      data.costo_unitario = number(data.costo_unitario, 'Costo unitario', { min: 0, max: 100000000 }) ?? 0
      data.costo_total = data.costo_unitario > 0 ? Math.round(data.cantidad * data.costo_unitario * 100) / 100 : number(data.costo_total, 'Costo total', { required: true, min: 0.01, max: 100000000 })
      return data
    case 'calidad':
      data.fecha = date(data.fecha, 'Fecha de evaluación', { required: true, future: false })
      data.lote_id = number(data.lote_id, 'Lote', { required: true, min: 1 })
      for (const field of ['fragancia','sabor','acidez','cuerpo','uniformidad','taza_limpia','dulzor']) data[field] = number(data[field], field.replace('_', ' '), { required: true, min: 0, max: 10 })
      data.puntaje_sca = Math.round((data.fragancia + data.sabor + data.acidez + data.cuerpo + data.uniformidad + data.taza_limpia + data.dulzor) * 10) / 10
      data.evaluador = text(data.evaluador, 'Evaluador', { required: true, min: 2, max: 120 })
      return data
    case 'clima':
      data.fecha = date(data.fecha, 'Fecha climática', { required: true, future: false })
      data.precipitacion_mm = number(data.precipitacion_mm, 'Precipitación', { min: 0, max: 2000 })
      data.temp_actual = number(data.temp_actual, 'Temperatura actual', { min: -10, max: 60 })
      data.sensacion_termica = number(data.sensacion_termica, 'Sensación térmica', { min: -20, max: 70 })
      data.presion_superficie_hpa = number(data.presion_superficie_hpa, 'Presión superficial', { min: 500, max: 1200 })
      data.temp_max = number(data.temp_max, 'Temperatura máxima', { min: -10, max: 60 })
      data.temp_min = number(data.temp_min, 'Temperatura mínima', { min: -10, max: 60 })
      data.humedad_relativa = number(data.humedad_relativa, 'Humedad relativa', { min: 0, max: 100 })
      data.velocidad_viento = number(data.velocidad_viento, 'Velocidad del viento', { min: 0, max: 300 })
      data.codigo_clima = number(data.codigo_clima, 'Código climático', { min: 0, max: 999 })
      data.latitud = number(data.latitud, 'Latitud', { min: -90, max: 90 })
      data.longitud = number(data.longitud, 'Longitud', { min: -180, max: 180 })
      data.ubicacion_nombre = text(data.ubicacion_nombre, 'Ubicación climática', { max: 180 })
      data.zona_horaria = text(data.zona_horaria, 'Zona horaria', { max: 80 })
      data.fuente = text(data.fuente || 'manual', 'Fuente climática', { required: true, min: 2, max: 80 })
      data.notas = text(data.notas, 'Notas climáticas', { max: 500 })
      if (data.temp_max != null && data.temp_min != null && data.temp_max < data.temp_min) throw new Error('La temperatura máxima no puede ser menor que la mínima.')
      return data
    case 'recolector':
      data.nombre_completo = text(data.nombre_completo, 'Nombre del recolector', { required: true, min: 3, max: 140 })
      data.identificacion = text(data.identificacion, 'Identificación', { max: 40 })
      data.telefono = text(data.telefono, 'Teléfono', { max: 30 })
      if (data.telefono && !/^[0-9+()\-\s]{7,30}$/.test(data.telefono)) throw new Error('El teléfono del recolector tiene un formato inválido.')
      return data
    case 'proveedor_cafe':
      data.codigo = text(data.codigo, 'Código del proveedor', { max: 30 })
      data.nombre = text(data.nombre, 'Nombre del proveedor', { required: true, min: 3, max: 160 })
      data.tipo = enumValue(data.tipo || 'productor', 'Tipo de proveedor', ['productor','intermediario','cooperativa','beneficio','exportador','otro'])
      data.identificacion = text(data.identificacion, 'Identificación', { max: 60 })
      data.telefono = text(data.telefono, 'Teléfono', { max: 30 })
      data.email = text(data.email, 'Correo', { max: 120 })
      data.ubicacion = text(data.ubicacion, 'Ubicación', { max: 180 })
      if (data.telefono && !/^[0-9+()\-\s]{7,30}$/.test(data.telefono)) throw new Error('El teléfono del proveedor tiene un formato inválido.')
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('El correo del proveedor tiene un formato inválido.')
      return data
    case 'compra_cafe': {
      data.codigo = text(data.codigo, 'Código de compra', { required: true, min: 3, max: 40 })
      data.proveedor_id = number(data.proveedor_id, 'Proveedor', { required: true, min: 1 })
      data.fecha = date(data.fecha, 'Fecha de compra', { required: true, future: false })
      data.tipo_producto = enumValue(data.tipo_producto, 'Estado del café', ['cereza','pergamino_humedo','pergamino_seco','verde','tostado'])
      data.cantidad_kg = number(data.cantidad_kg, 'Cantidad en kilogramos', { min: 0, max: 10000000 }) ?? 0
      data.cantidad_qq = number(data.cantidad_qq, 'Cantidad en quintales', { min: 0, max: 1000000 }) ?? 0
      if (data.cantidad_kg <= 0 && data.cantidad_qq <= 0) throw new Error('Indique la cantidad comprada en kilogramos o quintales.')
      if (data.cantidad_kg <= 0) data.cantidad_kg = Math.round(data.cantidad_qq * 46 * 100) / 100
      if (data.cantidad_qq <= 0) data.cantidad_qq = Math.round((data.cantidad_kg / 46) * 10000) / 10000
      data.precio_por_kg = number(data.precio_por_kg, 'Precio por kilogramo', { min: 0, max: 1000000 }) ?? 0
      data.precio_por_qq = number(data.precio_por_qq, 'Precio por quintal', { min: 0, max: 100000000 }) ?? 0
      if (data.precio_por_kg <= 0 && data.precio_por_qq <= 0) throw new Error('Indique el precio por kilogramo o por quintal.')
      if (data.precio_por_kg <= 0) data.precio_por_kg = data.precio_por_qq / 46
      if (data.precio_por_qq <= 0) data.precio_por_qq = data.precio_por_kg * 46
      data.costo_total = Math.round(data.cantidad_kg * data.precio_por_kg * 100) / 100
      data.humedad_porcentaje = number(data.humedad_porcentaje, 'Humedad', { min: 0, max: 100 })
      data.defectos_porcentaje = number(data.defectos_porcentaje, 'Defectos', { min: 0, max: 100 })
      data.estado_calidad = enumValue(data.estado_calidad || 'pendiente', 'Estado de calidad', ['pendiente','aprobado','condicionado','rechazado'])
      data.temporada = text(data.temporada, 'Temporada', { max: 40 })
      data.variedad = text(data.variedad, 'Variedad', { max: 80 })
      data.origen_geografico = text(data.origen_geografico, 'Origen geográfico', { max: 180 })
      data.finca_origen = text(data.finca_origen, 'Finca de origen', { max: 160 })
      data.lote_proveedor = text(data.lote_proveedor, 'Lote del proveedor', { max: 80 })
      data.factura_comprobante = text(data.factura_comprobante, 'Factura o comprobante', { max: 80 })
      data.ubicacion_recepcion = text(data.ubicacion_recepcion, 'Ubicación de recepción', { max: 160 })
      data.observaciones = text(data.observaciones, 'Observaciones', { max: 500 })
      if (['pergamino_seco','verde'].includes(data.tipo_producto) && data.humedad_porcentaje != null && (data.humedad_porcentaje < 8 || data.humedad_porcentaje > 14.5)) {
        data.advertencia_calidad = 'La humedad está fuera del rango operativo usual de almacenamiento; revise la recepción antes de aprobar.'
      }
      return data
    }
    case 'temporada':
      data.nombre = text(data.nombre, 'Nombre de temporada', { required: true, min: 3, max: 60 })
      data.fecha_inicio = date(data.fecha_inicio, 'Inicio de temporada', { required: true })
      data.fecha_fin = date(data.fecha_fin, 'Fin de temporada', { required: true })
      if (data.fecha_fin < data.fecha_inicio) throw new Error('La temporada no puede terminar antes de iniciar.')
      data.estado = enumValue(data.estado || 'activa', 'Estado de temporada', ['planificada','activa','cerrada'])
      data.precio_unidad_default = number(data.precio_unidad_default, 'Precio por unidad', { min: 0, max: 100000 }) ?? 0
      data.unidad_default = enumValue(data.unidad_default || 'lata', 'Unidad', ['lata','kg','canasta'])
      data.peso_lata_kg = number(data.peso_lata_kg, 'Peso de lata', { min: 1, max: 100 }) ?? 18
      return data
    case 'huella':
      data.fecha = date(data.fecha, 'Fecha de emisión', { required: true, future: false })
      data.tipo_emision = enumValue(data.tipo_emision, 'Tipo de emisión', ['fertilizante','combustible','energia','transporte','otros'])
      data.cantidad_kg = number(data.cantidad_kg, 'Cantidad', { required: true, min: 0.01, max: 100000000 })
      data.notas = text(data.notas, 'Notas', { max: 300 })
      return data
    case 'practica':
      data.tipo_practica = enumValue(data.tipo_practica, 'Práctica', ['compostaje','agroforesteria','cobertura','curvas_nivel','barreras_vivas','cortinas_rompevientos'])
      data.fecha_inicio = date(data.fecha_inicio, 'Fecha de inicio', { required: true, future: false })
      data.fecha_fin = date(data.fecha_fin, 'Fecha de finalización')
      if (data.fecha_fin && data.fecha_fin < data.fecha_inicio) throw new Error('La fecha final de la práctica no puede ser anterior al inicio.')
      data.area_mz = number(data.area_mz, 'Área de la práctica', { min: 0.01, max: 100000 })
      data.notas = text(data.notas, 'Notas', { max: 400 })
      return data
    case 'certificacion':
      data.tipo = enumValue(data.tipo, 'Certificación', ['organico','rainforest','comercio_justo','utz','carbon_neutral','bird_friendly','4c'])
      data.entidad_certificadora = text(data.entidad_certificadora, 'Entidad certificadora', { required: true, min: 2, max: 140 })
      data.fecha_obtencion = date(data.fecha_obtencion, 'Fecha de obtención', { required: true, future: false })
      data.fecha_vencimiento = date(data.fecha_vencimiento, 'Fecha de vencimiento')
      if (data.fecha_vencimiento && data.fecha_vencimiento <= data.fecha_obtencion) throw new Error('La fecha de vencimiento debe ser posterior a la fecha de obtención.')
      return data
    case 'alerta':
      data.lote_id = number(data.lote_id, 'Lote', { min: 1 })
      data.tipo_alerta = enumValue(data.tipo_alerta, 'Tipo de alerta', ['roya','broca','oteada','helada','sequia','inundacion'])
      data.nivel = enumValue(data.nivel, 'Nivel de alerta', ['bajo','medio','alto'])
      data.fecha_inicio = date(data.fecha_inicio || todayText(), 'Fecha de inicio', { required: true, future: false })
      data.recomendacion = text(data.recomendacion, 'Recomendación', { required: data.nivel === 'alto', min: data.nivel === 'alto' ? 8 : 0, max: 500 })
      return data
    case 'marketing_cliente':
      data.nombre = text(data.nombre, 'Nombre del cliente', { required: true, min: 2, max: 140 })
      data.email = text(data.email, 'Correo', { max: 140 })
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('El correo del cliente tiene un formato inválido.')
      data.telefono = text(data.telefono, 'Teléfono', { max: 30 })
      if (data.telefono && !/^[0-9+()\-\s]{7,30}$/.test(data.telefono)) throw new Error('El teléfono del cliente tiene un formato inválido.')
      return data
    case 'campana':
      data.nombre = text(data.nombre, 'Nombre de campaña', { required: true, min: 3, max: 140 })
      data.tipo = enumValue(data.tipo, 'Tipo de campaña', ['email','redes','lealtad','recomendacion'])
      data.estado = enumValue(data.estado || 'borrador', 'Estado', ['borrador','activa','completada','cancelada'])
      data.fecha_inicio = date(data.fecha_inicio, 'Fecha de inicio', { required: true })
      data.fecha_fin = date(data.fecha_fin, 'Fecha final')
      if (data.fecha_fin && data.fecha_fin < data.fecha_inicio) throw new Error('La campaña no puede finalizar antes de iniciar.')
      data.contenido = text(data.contenido, 'Contenido', { max: 3000 })
      if (data.estado === 'activa' && !data.contenido) throw new Error('Una campaña activa necesita contenido.')
      return data
    case 'lealtad':
      data.cliente_id = number(data.cliente_id, 'Cliente', { required: true, min: 1 })
      data.puntos = number(data.puntos, 'Puntos', { required: true, min: 1, max: 1000000 })
      data.concepto = text(data.concepto, 'Concepto', { required: true, min: 2, max: 160 })
      return data
    case 'precio_mercado':
      data.fecha = date(data.fecha, 'Fecha del precio', { required: true, future: false })
      data.tipo_cafe = enumValue(data.tipo_cafe, 'Tipo de café', ['arabica','robusta'])
      data.precio_usd_kg = number(data.precio_usd_kg, 'Precio USD/kg', { required: true, min: 0.01, max: 10000 })
      data.fuente = text(data.fuente, 'Fuente', { required: true, min: 2, max: 160 })
      return data
    default:
      return data
  }
}
