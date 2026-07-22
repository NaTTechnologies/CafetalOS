import { describe, expect, it, vi } from 'vitest'
import {
  WeatherService,
  buildForecastUrl,
  evaluateExtractionAlerts,
  normalizeForecastPayload,
  normalizeGeocodingPayload
} from '../../src/main/weather-service.js'

const payload = {
  latitude: 14.91,
  longitude: -88.23,
  elevation: 1420,
  timezone: 'America/Tegucigalpa',
  current_units: {
    temperature_2m: '°C', relative_humidity_2m: '%', surface_pressure: 'hPa',
    precipitation: 'mm', wind_speed_10m: 'km/h'
  },
  current: {
    time: '2026-07-21T12:00', temperature_2m: 25.4, relative_humidity_2m: 78,
    surface_pressure: 856.2, apparent_temperature: 26.1, precipitation: 0.2,
    rain: 0.2, weather_code: 2, wind_speed_10m: 7.3, wind_direction_10m: 110
  },
  daily: {
    time: ['2026-07-21'], temperature_2m_max: [29], temperature_2m_min: [18],
    precipitation_sum: [3.2], precipitation_probability_max: [65], weather_code: [61],
    wind_speed_10m_max: [15]
  }
}

describe('servicio climático Open-Meteo', () => {
  it('construye una consulta con las variables obligatorias del ERS', () => {
    const url = buildForecastUrl({ latitude: 14.91, longitude: -88.23 })
    expect(url).toContain('temperature_2m')
    expect(url).toContain('relative_humidity_2m')
    expect(url).toContain('surface_pressure')
    expect(url).toContain('timezone=auto')
  })

  it('normaliza clima actual, pronóstico y diagnóstico de humedad', () => {
    const normalized = normalizeForecastPayload(payload, { locationName: 'Santa Bárbara' })
    expect(normalized.current.temperature).toBe(25.4)
    expect(normalized.current.relativeHumidity).toBe(78)
    expect(normalized.current.surfacePressure).toBe(856.2)
    expect(normalized.daily).toHaveLength(1)
    expect(normalized.extractionAlerts[0].code).toBe('humidity-high')
  })

  it('aplica los umbrales de humedad definidos en el ERS', () => {
    expect(evaluateExtractionAlerts({ relativeHumidity: 71 })[0].code).toBe('humidity-high')
    expect(evaluateExtractionAlerts({ relativeHumidity: 39 })[0].code).toBe('humidity-low')
    expect(evaluateExtractionAlerts({ relativeHumidity: 55 })[0].code).toBe('humidity-stable')
  })

  it('usa caché vigente durante 30 minutos sin repetir la llamada HTTP', async () => {
    const cached = normalizeForecastPayload(payload, { locationName: 'Santa Bárbara' })
    const fetchJson = vi.fn()
    const service = new WeatherService({
      fetchJson,
      readCache: async () => ({ payload: cached, fetchedAt: '2026-07-21T12:00:00.000Z' }),
      now: () => new Date('2026-07-21T12:20:00.000Z').getTime()
    })
    const result = await service.getCurrent({ latitude: 14.91, longitude: -88.23 })
    expect(result.cache.hit).toBe(true)
    expect(result.cache.stale).toBe(false)
    expect(fetchJson).not.toHaveBeenCalled()
  })

  it('activa modo local con la última caché cuando falla la red', async () => {
    const cached = normalizeForecastPayload(payload, { locationName: 'Santa Bárbara' })
    const service = new WeatherService({
      fetchJson: async () => { throw new Error('sin conexión') },
      readCache: async () => ({ payload: cached, fetchedAt: '2026-07-20T12:00:00.000Z' }),
      now: () => new Date('2026-07-21T12:00:00.000Z').getTime()
    })
    const result = await service.getCurrent({ latitude: 14.91, longitude: -88.23 })
    expect(result.offline).toBe(true)
    expect(result.cache.stale).toBe(true)
    expect(result.offlineMessage).toContain('Modo local activo')
  })

  it('normaliza resultados de búsqueda manual', () => {
    const results = normalizeGeocodingPayload({ results: [{ id: 1, name: 'Santa Bárbara', latitude: 14.91, longitude: -88.23, country: 'Honduras', admin1: 'Santa Bárbara' }] })
    expect(results[0].label).toContain('Santa Bárbara')
    expect(results[0].country).toBe('Honduras')
  })
})
