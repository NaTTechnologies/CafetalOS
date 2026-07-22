const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search'
const DEFAULT_TTL_MS = 30 * 60 * 1000

function finiteNumber(value, label) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${label} no es válido.`)
  return number
}

export function normalizeCoordinates(latitude, longitude) {
  const lat = finiteNumber(latitude, 'La latitud')
  const lon = finiteNumber(longitude, 'La longitud')
  if (lat < -90 || lat > 90) throw new Error('La latitud debe estar entre -90 y 90.')
  if (lon < -180 || lon > 180) throw new Error('La longitud debe estar entre -180 y 180.')
  return { latitude: Math.round(lat * 1000000) / 1000000, longitude: Math.round(lon * 1000000) / 1000000 }
}

export function climateCacheKey(latitude, longitude) {
  const coordinates = normalizeCoordinates(latitude, longitude)
  return `${coordinates.latitude.toFixed(4)},${coordinates.longitude.toFixed(4)}`
}

export function buildForecastUrl({ latitude, longitude, forecastDays = 7 }) {
  const coordinates = normalizeCoordinates(latitude, longitude)
  const url = new URL(FORECAST_ENDPOINT)
  url.searchParams.set('latitude', String(coordinates.latitude))
  url.searchParams.set('longitude', String(coordinates.longitude))
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'surface_pressure',
    'apparent_temperature',
    'precipitation',
    'rain',
    'weather_code',
    'wind_speed_10m',
    'wind_direction_10m'
  ].join(','))
  url.searchParams.set('daily', [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'weather_code',
    'wind_speed_10m_max'
  ].join(','))
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', String(Math.min(14, Math.max(1, Number(forecastDays || 7)))))
  return url.toString()
}

export function buildGeocodingUrl(query, count = 8) {
  const text = String(query || '').trim()
  if (text.length < 2) throw new Error('Escriba al menos 2 caracteres para buscar una ubicación.')
  const url = new URL(GEOCODING_ENDPOINT)
  url.searchParams.set('name', text)
  url.searchParams.set('count', String(Math.min(20, Math.max(1, Number(count || 8)))))
  url.searchParams.set('language', 'es')
  url.searchParams.set('format', 'json')
  return url.toString()
}

export function weatherCodeLabel(code) {
  const labels = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla con escarcha',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nieve ligera',
    73: 'Nieve moderada',
    75: 'Nieve intensa',
    80: 'Chubascos ligeros',
    81: 'Chubascos moderados',
    82: 'Chubascos fuertes',
    95: 'Tormenta eléctrica',
    96: 'Tormenta con granizo',
    99: 'Tormenta fuerte con granizo'
  }
  return labels[Number(code)] || 'Condición no clasificada'
}

export function evaluateExtractionAlerts(current = {}) {
  const humidity = Number(current.relativeHumidity)
  if (!Number.isFinite(humidity)) return []
  if (humidity > 70) {
    return [{
      code: 'humidity-high',
      level: 'danger',
      title: 'Humedad ambiental alta',
      message: 'La humedad supera 70%. Para extracción de espresso, ensanche ligeramente la molienda y verifique nuevamente el tiempo de extracción antes de fijar el ajuste.'
    }]
  }
  if (humidity < 40) {
    return [{
      code: 'humidity-low',
      level: 'warning',
      title: 'Humedad ambiental baja',
      message: 'La humedad es menor a 40%. Para extracción de espresso, cierre ligeramente la molienda y vigile estática y canalización.'
    }]
  }
  return [{
    code: 'humidity-stable',
    level: 'success',
    title: 'Humedad ambiental estable',
    message: 'La humedad se encuentra entre 40% y 70%. Mantenga la receta y confirme el resultado en taza antes de cambiar la molienda.'
  }]
}

export function normalizeForecastPayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object' || !payload.current) throw new Error('Open-Meteo devolvió una respuesta incompleta.')
  const current = payload.current
  const units = payload.current_units || {}
  const daily = payload.daily || {}
  const dates = Array.isArray(daily.time) ? daily.time : []
  const normalizedCurrent = {
    time: current.time || new Date().toISOString(),
    temperature: Number(current.temperature_2m),
    relativeHumidity: Number(current.relative_humidity_2m),
    surfacePressure: Number(current.surface_pressure),
    apparentTemperature: Number(current.apparent_temperature),
    precipitation: Number(current.precipitation || 0),
    rain: Number(current.rain || 0),
    weatherCode: Number(current.weather_code),
    weatherLabel: weatherCodeLabel(current.weather_code),
    windSpeed: Number(current.wind_speed_10m || 0),
    windDirection: Number(current.wind_direction_10m || 0),
    units: {
      temperature: units.temperature_2m || '°C',
      relativeHumidity: units.relative_humidity_2m || '%',
      surfacePressure: units.surface_pressure || 'hPa',
      precipitation: units.precipitation || 'mm',
      windSpeed: units.wind_speed_10m || 'km/h'
    }
  }
  const forecast = dates.map((date, index) => ({
    date,
    temperatureMax: Number(daily.temperature_2m_max?.[index]),
    temperatureMin: Number(daily.temperature_2m_min?.[index]),
    precipitationSum: Number(daily.precipitation_sum?.[index] || 0),
    precipitationProbability: Number(daily.precipitation_probability_max?.[index] || 0),
    weatherCode: Number(daily.weather_code?.[index]),
    weatherLabel: weatherCodeLabel(daily.weather_code?.[index]),
    windSpeedMax: Number(daily.wind_speed_10m_max?.[index] || 0)
  }))
  return {
    provider: 'Open-Meteo',
    latitude: Number(payload.latitude ?? options.latitude),
    longitude: Number(payload.longitude ?? options.longitude),
    elevation: Number(payload.elevation || 0),
    timezone: payload.timezone || 'auto',
    timezoneAbbreviation: payload.timezone_abbreviation || '',
    locationName: String(options.locationName || '').trim(),
    fetchedAt: new Date().toISOString(),
    current: normalizedCurrent,
    daily: forecast,
    extractionAlerts: evaluateExtractionAlerts(normalizedCurrent)
  }
}

export function normalizeGeocodingPayload(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : []
  return results.map(item => ({
    id: item.id,
    name: item.name,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    elevation: Number(item.elevation || 0),
    timezone: item.timezone || '',
    country: item.country || '',
    countryCode: item.country_code || '',
    admin1: item.admin1 || '',
    admin2: item.admin2 || '',
    label: [item.name, item.admin2, item.admin1, item.country].filter(Boolean).join(', ')
  }))
}

export class WeatherService {
  constructor({ fetchJson, readCache, writeCache, now = () => Date.now(), ttlMs = DEFAULT_TTL_MS }) {
    if (typeof fetchJson !== 'function') throw new Error('WeatherService necesita un cliente HTTP.')
    this.fetchJson = fetchJson
    this.readCache = typeof readCache === 'function' ? readCache : async () => null
    this.writeCache = typeof writeCache === 'function' ? writeCache : async () => {}
    this.now = now
    this.ttlMs = ttlMs
  }

  async getCurrent(options = {}) {
    const coordinates = normalizeCoordinates(options.latitude, options.longitude)
    const key = climateCacheKey(coordinates.latitude, coordinates.longitude)
    const cached = await this.readCache(key)
    const cachedAt = cached?.fetchedAt ? new Date(cached.fetchedAt).getTime() : 0
    const ageMs = cachedAt ? this.now() - cachedAt : Number.POSITIVE_INFINITY
    if (!options.force && cached?.payload && ageMs <= this.ttlMs) {
      return { ...cached.payload, locationName: options.locationName || cached.payload.locationName || '', cache: { hit: true, stale: false, ageMinutes: Math.max(0, Math.round(ageMs / 60000)), ttlMinutes: Math.round(this.ttlMs / 60000) } }
    }
    try {
      const payload = await this.fetchJson(buildForecastUrl({ ...coordinates, forecastDays: options.forecastDays || 7 }))
      const normalized = normalizeForecastPayload(payload, { ...coordinates, locationName: options.locationName })
      await this.writeCache(key, normalized)
      return { ...normalized, cache: { hit: false, stale: false, ageMinutes: 0, ttlMinutes: Math.round(this.ttlMs / 60000) } }
    } catch (error) {
      if (cached?.payload) {
        return {
          ...cached.payload,
          locationName: options.locationName || cached.payload.locationName || '',
          offline: true,
          offlineMessage: 'Modo local activo: configure sus variables ambientales de forma manual.',
          cache: { hit: true, stale: true, ageMinutes: Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 60000)) : null, ttlMinutes: Math.round(this.ttlMs / 60000) }
        }
      }
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`No fue posible consultar Open-Meteo. Modo local activo: configure sus variables ambientales de forma manual. Detalle: ${message}`)
    }
  }

  async searchLocations(query, count = 8) {
    const payload = await this.fetchJson(buildGeocodingUrl(query, count))
    return normalizeGeocodingPayload(payload)
  }
}

export { DEFAULT_TTL_MS, FORECAST_ENDPOINT, GEOCODING_ENDPOINT }
