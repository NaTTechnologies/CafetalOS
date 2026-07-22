// ─── Cafetal OS — Clima por Open-Meteo, modo local y alertas ───
const Clima = {
    currentWeather: null,
    currentLocation: null,
    providerStatus: null,
    locationResults: [],
    chart: null,

    async cargar(container) {
        try {
            const [registros, alertas, location, provider] = await Promise.all([
                window.api.clima.getRegistros(30),
                window.api.clima.getAlertas(),
                window.api.clima.getLocation(),
                window.api.clima.getProviderStatus()
            ]);
            this.currentLocation = location || {};
            this.providerStatus = provider || {};
            const ultimo = registros[0] || null;
            const humedadAlta = registros.filter(registro => Number(registro.humedad_relativa) > 80).length;

            container.innerHTML = `
                <div class="page-header climate-page-header">
                    <div>
                        <h2>🌤️ Clima y Alertas</h2>
                        <p class="page-subtitle">Monitoreo automático con Open-Meteo, caché local y registro manual cuando no hay conexión.</p>
                    </div>
                    <div class="page-actions climate-header-actions">
                        <button class="btn btn-outline" onclick="Clima.buscarConMiUbicacion()">📍 Mi ubicación</button>
                        <button class="btn btn-outline" onclick="Clima.mostrarBuscadorUbicacion()">🔎 Buscar lugar</button>
                        <button class="btn btn-primary" onclick="Clima.actualizarApi(true)">↻ Actualizar API</button>
                        <button class="btn btn-success" onclick="Clima.mostrarFormRegistro()">＋ Registro manual</button>
                    </div>
                </div>
                <div class="page-body climate-page-body">
                    <section id="climate-live-panel" class="climate-live-panel">
                        ${this.renderLivePlaceholder()}
                    </section>

                    <div class="climate-secondary-grid">
                        <section class="card climate-history-card">
                            <div class="card-header responsive-card-header">
                                <div><strong>📈 Historial climático</strong><small>Últimos 30 días guardados localmente</small></div>
                                <span class="status-pill ${ultimo?.fuente === 'open-meteo' ? 'aprobado' : 'pendiente'}">${Utils.escapar(ultimo?.fuente || 'sin datos')}</span>
                            </div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm"><canvas id="chartClima"></canvas></div>
                            </div>
                        </section>

                        <section class="card climate-alert-card">
                            <div class="card-header responsive-card-header">
                                <div><strong>⚠️ Alertas fitosanitarias</strong><small>Seguimiento agronómico por lote</small></div>
                                <button class="btn btn-sm btn-outline" onclick="Clima.mostrarFormAlerta()">Crear alerta</button>
                            </div>
                            <div class="card-body climate-alert-list">
                                ${this.renderFitosanitaryAlerts(alertas)}
                            </div>
                        </section>
                    </div>

                    <section class="card climate-records-card">
                        <div class="card-header responsive-card-header">
                            <div><strong>📋 Bitácora climática</strong><small>Lecturas de API, estación, demo y registros manuales</small></div>
                            <span>${registros.length} registros visibles</span>
                        </div>
                        <div class="card-body">
                            ${this.renderRecords(registros)}
                        </div>
                    </section>

                    ${humedadAlta >= 3 ? `
                        <section class="climate-risk-banner danger">
                            <div class="climate-risk-icon">🍂</div>
                            <div>
                                <strong>Vigilancia recomendada por humedad persistente</strong>
                                <p>${humedadAlta} de los últimos 30 registros superan 80% de humedad relativa. Revise incidencia de roya, ventilación, sombra y drenaje con su asistencia técnica.</p>
                            </div>
                        </section>
                    ` : ''}

                    <p class="climate-attribution">Datos meteorológicos: Open-Meteo. Las coordenadas se procesan localmente y se transmiten al proveedor únicamente cuando se realiza una consulta.</p>
                </div>
            `;

            this.graficoClima(registros);
            if (location?.latitude != null && location?.longitude != null) await this.actualizarApi(false);
            else this.renderLocationRequired();
        } catch (error) {
            console.error('Error cargando clima:', error);
            container.innerHTML = `<div class="page-body"><div class="inline-alert">❌ ${Utils.escapar(error.message || 'No fue posible cargar el módulo climático.')}</div></div>`;
        }
    },

    renderLivePlaceholder() {
        return `<div class="climate-live-loading"><span class="climate-spinner"></span><div><strong>Preparando monitoreo climático…</strong><p>Se verificará la ubicación guardada y la caché local.</p></div></div>`;
    },

    renderLocationRequired() {
        const host = document.getElementById('climate-live-panel');
        if (!host) return;
        host.innerHTML = `
            <div class="climate-empty-state">
                <div class="climate-empty-icon">📍</div>
                <h3>Configure la ubicación de la finca</h3>
                <p>Use la ubicación del dispositivo o busque manualmente una ciudad, municipio o aldea. Cafetal OS guardará las coordenadas localmente.</p>
                <div class="climate-empty-actions">
                    <button class="btn btn-primary" onclick="Clima.buscarConMiUbicacion()">Usar mi ubicación</button>
                    <button class="btn btn-outline" onclick="Clima.mostrarBuscadorUbicacion()">Buscar manualmente</button>
                </div>
            </div>`;
    },

    async actualizarApi(force = false, locationOverride = null) {
        const host = document.getElementById('climate-live-panel');
        if (!host) return;
        host.innerHTML = this.renderLivePlaceholder();
        try {
            const location = locationOverride || this.currentLocation || await window.api.clima.getLocation();
            if (location?.latitude == null || location?.longitude == null) {
                this.renderLocationRequired();
                return;
            }
            const weather = await window.api.clima.getCurrent({
                latitude: location.latitude,
                longitude: location.longitude,
                locationName: location.locationName,
                force,
                forecastDays: 7,
                persist: true
            });
            this.currentWeather = weather;
            this.currentLocation = {
                ...location,
                latitude: weather.latitude,
                longitude: weather.longitude,
                locationName: weather.locationName || location.locationName,
                timezone: weather.timezone
            };
            host.innerHTML = this.renderLiveWeather(weather);
            if (force) Utils.toast(weather.cache?.hit ? 'Clima recuperado de la caché local.' : '✅ Clima actualizado desde Open-Meteo.');
        } catch (error) {
            console.error('Error consultando Open-Meteo:', error);
            host.innerHTML = `
                <div class="climate-offline-state">
                    <div class="climate-empty-icon">☁️</div>
                    <div>
                        <h3>Modo local activo</h3>
                        <p>${Utils.escapar(error.message || 'No fue posible consultar el proveedor meteorológico.')}</p>
                        <div class="climate-empty-actions">
                            <button class="btn btn-outline" onclick="Clima.actualizarApi(true)">Reintentar</button>
                            <button class="btn btn-primary" onclick="Clima.mostrarFormRegistro()">Ingresar datos manualmente</button>
                        </div>
                    </div>
                </div>`;
            if (force) Utils.toast(`❌ ${error.message}`, 'error');
        }
    },

    renderLiveWeather(weather) {
        const current = weather.current || {};
        const cache = weather.cache || {};
        const location = weather.locationName || `${weather.latitude}, ${weather.longitude}`;
        const cacheLabel = weather.offline
            ? `Caché local · ${cache.ageMinutes ?? '—'} min`
            : cache.hit ? `Caché vigente · ${cache.ageMinutes ?? 0} min` : 'Consulta nueva';
        const cacheClass = weather.offline || cache.stale ? 'pendiente' : 'aprobado';
        return `
            ${weather.offline ? `<div class="climate-offline-banner">⚠️ ${Utils.escapar(weather.offlineMessage || 'Modo local activo.')}</div>` : ''}
            <div class="climate-live-header">
                <div>
                    <span class="eyebrow">Monitoreo en tiempo real</span>
                    <h3>${Utils.escapar(location)}</h3>
                    <p>${Utils.escapar(current.weatherLabel || 'Condición meteorológica')} · ${Utils.escapar(weather.timezone || '')}</p>
                </div>
                <div class="climate-provider-meta">
                    <span class="status-pill ${cacheClass}">${cacheLabel}</span>
                    <small>Open-Meteo · TTL ${cache.ttlMinutes || 30} min</small>
                </div>
            </div>
            <div class="climate-current-grid">
                ${this.metric('🌡️', 'Temperatura', `${this.number(current.temperature, 1)} °C`, `Sensación ${this.number(current.apparentTemperature, 1)} °C`)}
                ${this.metric('💧', 'Humedad relativa', `${this.number(current.relativeHumidity, 0)} %`, this.humidityInterpretation(current.relativeHumidity))}
                ${this.metric('🧭', 'Presión superficial', `${this.number(current.surfacePressure, 1)} hPa`, 'Presión atmosférica local')}
                ${this.metric('💨', 'Viento', `${this.number(current.windSpeed, 1)} km/h`, `Dirección ${this.number(current.windDirection, 0)}°`)}
                ${this.metric('🌧️', 'Precipitación actual', `${this.number(current.precipitation, 1)} mm`, `Lluvia ${this.number(current.rain, 1)} mm`)}
            </div>
            <div class="climate-live-content-grid">
                <section class="climate-forecast-section">
                    <div class="climate-section-title"><div><strong>Pronóstico de 7 días</strong><small>Temperatura, lluvia y viento máximo</small></div></div>
                    <div class="climate-forecast-list">
                        ${(weather.daily || []).map(day => `
                            <article class="climate-forecast-day">
                                <strong>${this.dayLabel(day.date)}</strong>
                                <span class="climate-weather-code">${this.weatherIcon(day.weatherCode)}</span>
                                <small>${Utils.escapar(day.weatherLabel || '')}</small>
                                <b>${this.number(day.temperatureMax, 1)}° / ${this.number(day.temperatureMin, 1)}°</b>
                                <span>🌧️ ${this.number(day.precipitationSum, 1)} mm · ${this.number(day.precipitationProbability, 0)}%</span>
                                <span>💨 ${this.number(day.windSpeedMax, 1)} km/h</span>
                            </article>`).join('')}
                    </div>
                </section>
                <section class="climate-extraction-section">
                    <div class="climate-section-title"><div><strong>Diagnóstico ambiental de extracción</strong><small>Reglas técnicas opcionales para barismo</small></div></div>
                    <div class="climate-diagnostic-list">
                        ${(weather.extractionAlerts || []).map(alert => `
                            <article class="climate-diagnostic ${Utils.escapar(alert.level)}">
                                <strong>${Utils.escapar(alert.title)}</strong>
                                <p>${Utils.escapar(alert.message)}</p>
                            </article>`).join('')}
                    </div>
                    <p class="climate-disclaimer">La recomendación de molienda es una señal preventiva. Debe confirmarse con dosis, rendimiento, tiempo y evaluación sensorial de la extracción.</p>
                </section>
            </div>`;
    },

    metric(icon, label, value, detail) {
        return `<article class="climate-current-card"><span>${icon}</span><div><small>${label}</small><strong>${value}</strong><p>${detail}</p></div></article>`;
    },

    number(value, decimals = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? Utils.numero(number, decimals) : '—';
    },

    humidityInterpretation(value) {
        const humidity = Number(value);
        if (!Number.isFinite(humidity)) return 'Sin lectura';
        if (humidity > 70) return 'Alta para extracción';
        if (humidity < 40) return 'Baja para extracción';
        return 'Rango ambiental estable';
    },

    dayLabel(dateText) {
        if (!dateText) return '—';
        return new Intl.DateTimeFormat('es-HN', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${dateText}T12:00:00`));
    },

    weatherIcon(code) {
        const value = Number(code);
        if (value === 0) return '☀️';
        if ([1, 2].includes(value)) return '🌤️';
        if ([3, 45, 48].includes(value)) return '☁️';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(value)) return '🌧️';
        if ([95, 96, 99].includes(value)) return '⛈️';
        return '🌦️';
    },

    renderFitosanitaryAlerts(alertas) {
        if (!alertas.length) return '<div class="climate-alert-empty">✅ No hay alertas fitosanitarias activas.</div>';
        return alertas.map(alerta => `
            <article class="climate-fito-alert ${Utils.escapar(alerta.nivel)}">
                <div class="climate-fito-title">
                    <div><strong>${this.nombreAlerta(alerta.tipo_alerta)}</strong>${alerta.lote_codigo ? `<small>Lote ${Utils.escapar(alerta.lote_codigo)}</small>` : '<small>Alerta general</small>'}</div>
                    <span class="status-pill ${alerta.nivel === 'alto' ? 'rechazado' : alerta.nivel === 'medio' ? 'pendiente' : 'aprobado'}">${Utils.escapar(alerta.nivel)}</span>
                </div>
                ${alerta.recomendacion ? `<p>${Utils.escapar(alerta.recomendacion)}</p>` : ''}
                <button class="btn btn-sm btn-outline" onclick="Clima.resolverAlerta(${Number(alerta.id)})">Marcar resuelta</button>
            </article>`).join('');
    },

    renderRecords(registros) {
        if (!registros.length) return '<div class="education-empty">Sin registros climáticos. Consulte Open-Meteo o agregue una lectura manual.</div>';
        return `<div class="table-container"><table class="climate-record-table"><thead><tr><th>Fecha</th><th>Actual</th><th>Máx/Mín</th><th>Humedad</th><th>Presión</th><th>Precipitación</th><th>Viento</th><th>Ubicación/Fuente</th></tr></thead><tbody>
            ${registros.slice(0, 40).map(registro => `<tr>
                <td>${Utils.fecha(registro.fecha)}</td>
                <td>${registro.temp_actual != null ? `${this.number(registro.temp_actual, 1)} °C` : '—'}</td>
                <td>${this.number(registro.temp_max, 1)}° / ${this.number(registro.temp_min, 1)}°</td>
                <td>${this.number(registro.humedad_relativa, 0)}%</td>
                <td>${registro.presion_superficie_hpa != null ? `${this.number(registro.presion_superficie_hpa, 1)} hPa` : '—'}</td>
                <td>${this.number(registro.precipitacion_mm, 1)} mm</td>
                <td>${this.number(registro.velocidad_viento, 1)} km/h</td>
                <td><strong>${Utils.escapar(registro.ubicacion_nombre || 'Local')}</strong><small class="table-secondary">${Utils.escapar(registro.fuente || 'manual')}</small></td>
            </tr>`).join('')}
        </tbody></table></div>`;
    },

    graficoClima(registros) {
        const canvas = document.getElementById('chartClima');
        if (!canvas || !registros.length || typeof Chart === 'undefined') return;
        this.chart?.destroy?.();
        const datos = registros.slice(0, 30).reverse();
        this.chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: datos.map(dato => String(dato.fecha || '').substring(5)),
                datasets: [
                    { label: 'Temp. máxima', data: datos.map(dato => dato.temp_max), borderColor: '#b64f4f', tension: 0.3, fill: false },
                    { label: 'Temp. mínima', data: datos.map(dato => dato.temp_min), borderColor: '#3977a7', tension: 0.3, fill: false },
                    { label: 'Humedad %', data: datos.map(dato => dato.humedad_relativa), borderColor: '#2f6a51', tension: 0.3, borderDash: [5, 5], fill: false }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } } } }
        });
    },

    async buscarConMiUbicacion() {
        if (!navigator.geolocation) {
            Utils.toast('La geolocalización no está disponible. Use la búsqueda manual.', 'error');
            this.mostrarBuscadorUbicacion();
            return;
        }
        Utils.toast('Solicitando ubicación al sistema…');
        navigator.geolocation.getCurrentPosition(async position => {
            try {
                const location = await window.api.clima.setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    locationName: 'Ubicación del dispositivo',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
                });
                this.currentLocation = location;
                await this.actualizarApi(true, location);
            } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
        }, error => {
            const messages = { 1: 'Permiso de ubicación denegado.', 2: 'No fue posible determinar la ubicación.', 3: 'La ubicación tardó demasiado.' };
            Utils.toast(messages[error.code] || error.message || 'No fue posible obtener la ubicación.', 'error');
            this.mostrarBuscadorUbicacion();
        }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
    },

    mostrarBuscadorUbicacion() {
        if (document.getElementById('modal-climate-location')) document.getElementById('modal-climate-location').remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-climate-location';
        overlay.innerHTML = `
            <div class="modal-content climate-location-modal">
                <div class="modal-header"><div><h3>🔎 Buscar ubicación</h3><p>Escriba una ciudad, municipio, aldea o código postal.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-climate-location')">×</button></div>
                <div class="modal-body">
                    <div class="climate-location-search"><input id="climate-location-query" class="form-control" placeholder="Ej. Santa Bárbara, Honduras" onkeydown="if(event.key==='Enter'){event.preventDefault();Clima.buscarUbicaciones()}"/><button class="btn btn-primary" onclick="Clima.buscarUbicaciones()">Buscar</button></div>
                    <p class="settings-help">La búsqueda solo se ejecuta al presionar Buscar. Los resultados provienen del servicio de geocodificación de Open-Meteo.</p>
                    <div id="climate-location-results" class="climate-location-results"><div class="education-empty">Escriba una ubicación para comenzar.</div></div>
                </div>
                <div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-climate-location')">Cancelar</button></div>
            </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('climate-location-query')?.focus(), 60);
    },

    async buscarUbicaciones() {
        const query = Utils.getVal('climate-location-query');
        const host = document.getElementById('climate-location-results');
        if (!query || query.trim().length < 2) { Utils.toast('Escriba al menos 2 caracteres.', 'error'); return; }
        host.innerHTML = '<div class="climate-live-loading compact"><span class="climate-spinner"></span><strong>Buscando ubicaciones…</strong></div>';
        try {
            this.locationResults = await window.api.clima.searchLocations(query.trim());
            if (!this.locationResults.length) {
                host.innerHTML = '<div class="education-empty">No se encontraron coincidencias. Intente con municipio y país.</div>';
                return;
            }
            host.innerHTML = this.locationResults.map((result, index) => `
                <button class="climate-location-result" onclick="Clima.seleccionarUbicacion(${index})">
                    <span>📍</span><div><strong>${Utils.escapar(result.label)}</strong><small>${this.number(result.latitude, 5)}, ${this.number(result.longitude, 5)} · ${Utils.escapar(result.timezone || 'zona automática')}</small></div><b>Usar</b>
                </button>`).join('');
        } catch (error) {
            host.innerHTML = `<div class="inline-alert">${Utils.escapar(error.message)}</div>`;
        }
    },

    async seleccionarUbicacion(index) {
        const selected = this.locationResults[Number(index)];
        if (!selected) return;
        try {
            const location = await window.api.clima.setLocation({ latitude: selected.latitude, longitude: selected.longitude, locationName: selected.label, timezone: selected.timezone || 'auto' });
            this.currentLocation = location;
            Utils.cerrarModal('modal-climate-location');
            await this.actualizarApi(true, location);
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    mostrarFormRegistro() {
        if (document.getElementById('modal-clima-registro')) document.getElementById('modal-clima-registro').remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-clima-registro';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:720px;">
                <div class="modal-header"><div><h3>🌡️ Registro climático manual</h3><p>Disponible durante fallos de red o para ingresar lecturas de una estación física.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-clima-registro')">×</button></div>
                <div class="modal-body"><form onsubmit="return false;">
                    <div class="form-row-3">
                        <div class="form-group"><label>Fecha *</label><input type="date" id="clima-fecha" class="form-control" value="${Utils.hoy()}"></div>
                        <div class="form-group"><label>Temperatura actual (°C)</label><input type="number" id="clima-tactual" class="form-control" step="0.1"></div>
                        <div class="form-group"><label>Presión superficial (hPa)</label><input type="number" id="clima-presion" class="form-control" step="0.1"></div>
                    </div>
                    <div class="form-row-4">
                        <div class="form-group"><label>Temp. máxima (°C)</label><input type="number" id="clima-tmax" class="form-control" step="0.1" value="28"></div>
                        <div class="form-group"><label>Temp. mínima (°C)</label><input type="number" id="clima-tmin" class="form-control" step="0.1" value="18"></div>
                        <div class="form-group"><label>Humedad (%)</label><input type="number" id="clima-humedad" class="form-control" min="0" max="100" value="75"></div>
                        <div class="form-group"><label>Precipitación (mm)</label><input type="number" id="clima-precipitacion" class="form-control" step="0.1" min="0" value="0"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Velocidad del viento (km/h)</label><input type="number" id="clima-viento" class="form-control" step="0.1" min="0" value="5"></div>
                        <div class="form-group"><label>Fuente</label><select id="clima-fuente" class="form-control"><option value="manual">Manual</option><option value="estacion local">Estación local</option><option value="sensor">Sensor</option></select></div>
                    </div>
                    <div class="form-group"><label>Notas</label><textarea id="clima-notas" class="form-control" rows="3" placeholder="Condiciones, observaciones o identificación del sensor"></textarea></div>
                </form></div>
                <div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-clima-registro')">Cancelar</button><button class="btn btn-success" onclick="Clima.guardarRegistro()">Guardar lectura</button></div>
            </div>`;
        document.body.appendChild(overlay);
    },

    async guardarRegistro() {
        try {
            await window.api.clima.crearRegistro({
                fecha: Utils.getVal('clima-fecha'), temp_actual: Utils.getVal('clima-tactual'), presion_superficie_hpa: Utils.getVal('clima-presion'),
                temp_max: Utils.getVal('clima-tmax'), temp_min: Utils.getVal('clima-tmin'), humedad_relativa: Utils.getVal('clima-humedad'),
                precipitacion_mm: Utils.getVal('clima-precipitacion'), velocidad_viento: Utils.getVal('clima-viento'),
                notas: Utils.getVal('clima-notas'), fuente: document.getElementById('clima-fuente')?.value || 'manual',
                ubicacion_nombre: this.currentLocation?.locationName || '', latitud: this.currentLocation?.latitude, longitud: this.currentLocation?.longitude
            });
            Utils.toast('✅ Registro climático guardado.');
            Utils.cerrarModal('modal-clima-registro');
            App.cargarPagina('clima');
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    mostrarFormAlerta() {
        if (document.getElementById('modal-clima-alerta')) document.getElementById('modal-clima-alerta').remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-clima-alerta';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:520px;">
                <div class="modal-header"><h3>⚠️ Crear alerta fitosanitaria</h3><button class="modal-close" onclick="Utils.cerrarModal('modal-clima-alerta')">×</button></div>
                <div class="modal-body"><form onsubmit="return false;">
                    <div class="form-row"><div class="form-group"><label>Tipo</label><select id="alerta-tipo" class="form-control"><option value="roya">Roya del café</option><option value="broca">Broca del café</option><option value="oteada">Ojo de gallo</option><option value="helada">Helada</option><option value="sequia">Sequía</option><option value="inundacion">Inundación</option></select></div><div class="form-group"><label>Nivel</label><select id="alerta-nivel" class="form-control"><option value="bajo">Bajo</option><option value="medio" selected>Medio</option><option value="alto">Alto</option></select></div></div>
                    <div class="form-group"><label>Lote</label><select id="alerta-lote" class="form-control"><option value="">General</option></select></div>
                    <div class="form-group"><label>Recomendación</label><textarea id="alerta-recomendacion" class="form-control" rows="4"></textarea></div>
                </form></div>
                <div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-clima-alerta')">Cancelar</button><button class="btn btn-success" onclick="Clima.guardarAlerta()">Guardar alerta</button></div>
            </div>`;
        document.body.appendChild(overlay);
        window.api.lotes.getAll().then(lotes => {
            const select = document.getElementById('alerta-lote');
            lotes.filter(lote => !Number(lote.es_sistema || 0)).forEach(lote => { const option = document.createElement('option'); option.value = lote.id; option.textContent = lote.codigo; select.appendChild(option); });
        });
    },

    async guardarAlerta() {
        try {
            await window.api.clima.crearAlerta({ lote_id: Utils.getVal('alerta-lote'), tipo_alerta: document.getElementById('alerta-tipo')?.value, nivel: document.getElementById('alerta-nivel')?.value, fecha_inicio: Utils.hoy(), recomendacion: Utils.getVal('alerta-recomendacion'), activa: 1 });
            Utils.toast('✅ Alerta registrada.');
            Utils.cerrarModal('modal-clima-alerta');
            App.cargarPagina('clima');
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    async resolverAlerta(id) {
        try { await window.api.clima.resolverAlerta(id); Utils.toast('✅ Alerta resuelta.'); App.cargarPagina('clima'); }
        catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    nombreAlerta(tipo) {
        const nombres = { roya: '🍂 Roya del café', broca: '🐛 Broca del café', oteada: '🌾 Ojo de gallo', helada: '❄️ Helada', sequia: '☀️ Sequía', inundacion: '🌊 Inundación' };
        return nombres[tipo] || tipo;
    }
};
window.Clima = Clima;
