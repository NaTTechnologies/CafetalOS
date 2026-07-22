import { describe, expect, it } from 'vitest'
import { validateEntity } from '../../src/main/domain-validation.js'

describe('validaciones de dominio cafetalero', () => {
  it('calcula kilos y pago de una cosecha', () => {
    const result = validateEntity('cosecha', {
      fecha: '2025-01-15', lote_id: 1, latas_recolectadas: 12, peso_lata_kg: 18, precio_por_lata: 65
    })
    expect(result.kilos_estimados).toBe(216)
    expect(result.total_pagado).toBe(780)
  })

  it('rechaza un beneficio físicamente incoherente', () => {
    expect(() => validateEntity('beneficio', {
      lote_id: 1, fecha_inicio: '2025-01-10', kilos_cereza_ingresados: 100, kilos_pergamino_seco: 120
    })).toThrow(/no puede superar/i)
  })

  it('calcula rendimiento de beneficio', () => {
    const result = validateEntity('beneficio', {
      lote_id: 1, fecha_inicio: '2025-01-10', kilos_cereza_ingresados: 1000, kilos_pergamino_seco: 210
    })
    expect(result.rendimiento_porcentaje).toBe(21)
  })

  it('exige cliente y precio en una venta', () => {
    expect(() => validateEntity('inventario', {
      tipo_producto: 'pergamino_seco', tipo_movimiento: 'venta', fecha_movimiento: '2025-01-10', cantidad_qq: 2
    })).toThrow(/cliente/i)
  })

  it('calcula el costo total del gasto', () => {
    const result = validateEntity('gasto', {
      fecha: '2025-01-10', categoria: 'insumos', descripcion: 'Sacos para almacenamiento', cantidad: 8, costo_unitario: 25
    })
    expect(result.costo_total).toBe(200)
  })

  it('rechaza temperatura máxima menor que mínima', () => {
    expect(() => validateEntity('clima', { fecha: '2025-01-10', temp_max: 14, temp_min: 18 })).toThrow(/máxima/i)
  })

  it('exige recomendación útil para una alerta alta', () => {
    expect(() => validateEntity('alerta', {
      lote_id: 1, tipo_alerta: 'roya', nivel: 'alto', fecha_inicio: '2025-01-10', recomendacion: 'Revisar'
    })).toThrow(/al menos 8/i)
  })

  it('rechaza certificaciones con vencimiento anterior', () => {
    expect(() => validateEntity('certificacion', {
      tipo: 'organico', entidad_certificadora: 'Entidad demo', fecha_obtencion: '2025-05-10', fecha_vencimiento: '2025-05-01'
    })).toThrow(/posterior/i)
  })

  it('requiere contenido cuando una campaña está activa', () => {
    expect(() => validateEntity('campana', {
      nombre: 'Campaña cosecha', tipo: 'redes', estado: 'activa', fecha_inicio: '2025-01-10', contenido: ''
    })).toThrow(/necesita contenido/i)
  })

  it('convierte compras de kilogramos a quintales y calcula el costo', () => {
    const result = validateEntity('compra_cafe', {
      codigo: 'CMP-TEST-001', proveedor_id: 1, fecha: '2025-01-15', tipo_producto: 'pergamino_seco',
      cantidad_kg: 460, precio_por_kg: 80, humedad_porcentaje: 11.2, defectos_porcentaje: 3, estado_calidad: 'aprobado'
    })
    expect(result.cantidad_qq).toBe(10)
    expect(result.precio_por_qq).toBe(3680)
    expect(result.costo_total).toBe(36800)
  })

  it('advierte humedad atípica en café seco comprado', () => {
    const result = validateEntity('compra_cafe', {
      codigo: 'CMP-TEST-002', proveedor_id: 1, fecha: '2025-01-15', tipo_producto: 'verde',
      cantidad_kg: 100, precio_por_kg: 100, humedad_porcentaje: 16, defectos_porcentaje: 2
    })
    expect(result.advertencia_calidad).toMatch(/fuera del rango/i)
  })

  it('calcula kilogramos y total de una venta de inventario', () => {
    const result = validateEntity('inventario', {
      tipo_producto: 'pergamino_seco', tipo_movimiento: 'venta', fecha_movimiento: '2025-01-10',
      cantidad_qq: 2, cliente_destino: 'Comprador de prueba', precio_venta_qq: 4000
    })
    expect(result.cantidad_kg).toBe(92)
    expect(result.total_venta).toBe(8000)
  })

  it('valida temporadas de cosecha', () => {
    expect(() => validateEntity('temporada', {
      nombre: 'Cosecha prueba', fecha_inicio: '2025-10-01', fecha_fin: '2025-09-30'
    })).toThrow(/terminar antes/i)
  })

})
