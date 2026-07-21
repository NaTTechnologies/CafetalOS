// ─── Cafetal OS — Módulo de Clima y Alertas Fitosanitarias ───

const Clima = {
    async cargar(container) {
        try {
            const registros = await window.api.clima.getRegistros(30);
            const alertas = await window.api.clima.getAlertas();

            const ultimo = registros.length > 0 ? registros[0] : null;

            // Detectar alertas automáticas
            const humedadAlta = registros.filter(r => r.humedad_relativa > 80).length;

            container.innerHTML = `
                <div class="page-header">
                    <h2>🌤️ Clima y Alertas</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-success" onclick="Clima.mostrarFormRegistro()">➕ Registrar Clima</button>
                        <button class="btn btn-outline" onclick="Clima.simularEstacion()">🔄 Simular Estación</button>
                    </div>
                </div>
                <div class="page-body">
                    <!-- Clima del día -->
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:${ultimo ? (ultimo.temp_max > 30 ? 'var(--rojo-cafe)' : 'var(--verde-hoja)') : 'var(--cafe-400)'};">
                            <div class="kpi-icon">🌡️</div>
                            <div class="kpi-value">${ultimo ? `${ultimo.temp_max || '—'}° / ${ultimo.temp_min || '—'}°` : 'Sin datos'}</div>
                            <div class="kpi-label">Temp. Máx/Mín ${ultimo ? '· ' + ultimo.fecha : ''}</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">💧</div>
                            <div class="kpi-value">${ultimo ? (ultimo.humedad_relativa || '—') + '%' : '—'}</div>
                            <div class="kpi-label">Humedad Relativa</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:${ultimo && ultimo.precipitacion_mm > 20 ? 'var(--rojo-cafe)' : 'var(--oro-cafe)'};">
                            <div class="kpi-icon">🌧️</div>
                            <div class="kpi-value">${ultimo ? (ultimo.precipitacion_mm || 0) + ' mm' : '—'}</div>
                            <div class="kpi-label">Precipitación</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:${alertas.length > 0 ? 'var(--rojo-cafe)' : 'var(--verde-hoja)'};">
                            <div class="kpi-icon">${alertas.length > 0 ? '🔴' : '✅'}</div>
                            <div class="kpi-value">${alertas.length}</div>
                            <div class="kpi-label">Alertas Activas</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <!-- Historial climático -->
                        <div class="card">
                            <div class="card-header">📈 Historial Climático (30 días)</div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm">
                                    <canvas id="chartClima"></canvas>
                                </div>
                            </div>
                        </div>
                        <!-- Alertas -->
                        <div class="card">
                            <div class="card-header">⚠️ Alertas Fitosanitarias</div>
                            <div class="card-body">
                                ${alertas.length === 0 ? '<p style="color:var(--cafe-400);">No hay alertas activas. ✅</p>' : `
                                    ${alertas.map(a => `
                                        <div style="padding:10px 14px;border-radius:8px;margin-bottom:8px;background:${a.nivel === 'alto' ? '#FFEBEE' : a.nivel === 'medio' ? '#FFF3E0' : '#E8F5E9'};border-left:4px solid ${a.nivel === 'alto' ? 'var(--rojo-cafe)' : a.nivel === 'medio' ? 'var(--oro-cafe)' : 'var(--verde-hoja)'};">
                                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                                <div>
                                                    <strong>${Clima.nombreAlerta(a.tipo_alerta)}</strong>
                                                    ${a.lote_codigo ? '· Lote ' + Utils.escapar(a.lote_codigo) : ''}
                                                </div>
                                                <span class="badge ${a.nivel === 'alto' ? 'badge-reposicion' : a.nivel === 'medio' ? 'badge-nuevo' : 'badge-produccion'}">${a.nivel}</span>
                                            </div>
                                            ${a.recomendacion ? `<div style="font-size:0.8rem;color:var(--cafe-500);margin-top:4px;">💡 ${Utils.escapar(a.recomendacion)}</div>` : ''}
                                            <button class="btn btn-sm btn-danger" style="margin-top:6px;" onclick="Clima.resolverAlerta(${a.id})">✅ Resolver</button>
                                        </div>
                                    `).join('')}
                                `}
                                <div style="margin-top:8px;">
                                    <button class="btn btn-sm btn-outline" onclick="Clima.mostrarFormAlerta()">⚠️ Crear Alerta Manual</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Registros recientes -->
                    <div class="card mt-4">
                        <div class="card-header">📋 Registros Climáticos</div>
                        <div class="card-body">
                            ${registros.length === 0 ? '<p style="color:var(--cafe-400);">Sin registros climáticos. ¡Registra el primero!</p>' : `
                                <div class="table-container">
                                    <table>
                                        <thead><tr><th>Fecha</th><th>Temp Máx</th><th>Temp Mín</th><th>Humedad</th><th>Precipitación</th><th>Viento</th><th>Fuente</th></tr></thead>
                                        <tbody>
                                            ${registros.slice(0, 20).map(r => `
                                                <tr>
                                                    <td>${r.fecha}</td>
                                                    <td>${r.temp_max ? r.temp_max + '°C' : '—'}</td>
                                                    <td>${r.temp_min ? r.temp_min + '°C' : '—'}</td>
                                                    <td>${r.humedad_relativa ? r.humedad_relativa + '%' : '—'}</td>
                                                    <td>${r.precipitacion_mm ? r.precipitacion_mm + ' mm' : '—'}</td>
                                                    <td>${r.velocidad_viento ? r.velocidad_viento + ' km/h' : '—'}</td>
                                                    <td><span class="badge badge-nuevo">${r.fuente || 'manual'}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Indicador de riesgo de Roya -->
                    ${humedadAlta >= 3 ? `
                        <div class="card" style="border-left:4px solid var(--rojo-cafe);background:#FFEBEE;">
                            <div class="card-body">
                                <div style="display:flex;align-items:center;gap:12px;">
                                    <div style="font-size:2rem;">⚠️</div>
                                    <div>
                                        <h4 style="margin:0;color:var(--rojo-cafe);">Riesgo Alto de Roya del Café</h4>
                                        <p style="margin:4px 0 0;font-size:0.85rem;color:var(--cafe-600);">
                                            ${humedadAlta} de los últimos 30 días han tenido humedad > 80%. 
                                            La roya del café (Hemileia vastatrix) se propaga en estas condiciones. 
                                            Recomendación: aplicar fungicida preventivo y monitorear lotes semanalmente.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            this.graficoClima(registros);

        } catch (err) {
            console.error('Error cargando clima:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar clima.</p></div>`;
        }
    },

    graficoClima(registros) {
        const canvas = document.getElementById('chartClima');
        if (!canvas || !registros.length) return;
        const datos = registros.slice(0, 30).reverse();
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: datos.map(d => d.fecha.substring(5)),
                datasets: [
                    { label: 'Temp Máx', data: datos.map(d => d.temp_max), borderColor: '#C62828', tension: 0.3, fill: false },
                    { label: 'Temp Mín', data: datos.map(d => d.temp_min), borderColor: '#1565C0', tension: 0.3, fill: false },
                    { label: 'Humedad %', data: datos.map(d => d.humedad_relativa), borderColor: '#2E7D32', tension: 0.3, borderDash: [5, 5], fill: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
                scales: { y: { beginAtZero: true } }
            }
        });
    },

    mostrarFormRegistro() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-clima-registro';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>🌤️ Registrar Datos Climáticos</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-clima-registro')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-clima" onsubmit="return false;">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="clima-fecha" class="form-control" value="${Utils.hoy()}">
                        </div>
                        <div class="form-row-4">
                            <div class="form-group">
                                <label>Temp. Máx (°C)</label>
                                <input type="number" id="clima-tmax" class="form-control" step="0.1" value="28">
                            </div>
                            <div class="form-group">
                                <label>Temp. Mín (°C)</label>
                                <input type="number" id="clima-tmin" class="form-control" step="0.1" value="18">
                            </div>
                            <div class="form-group">
                                <label>Humedad (%)</label>
                                <input type="number" id="clima-humedad" class="form-control" step="1" min="0" max="100" value="75">
                            </div>
                            <div class="form-group">
                                <label>Precipitación (mm)</label>
                                <input type="number" id="clima-precipitacion" class="form-control" step="0.1" min="0" value="0">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Velocidad del Viento (km/h)</label>
                            <input type="number" id="clima-viento" class="form-control" step="0.1" min="0" value="5">
                        </div>
                        <div class="form-group">
                            <label>Notas</label>
                            <input type="text" id="clima-notas" class="form-control" placeholder="ej: Día soleado con nubes dispersas">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-clima-registro')">Cancelar</button>
                    <button class="btn btn-success" onclick="Clima.guardarRegistro()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async guardarRegistro() {
        try {
            await window.api.clima.crearRegistro({
                fecha: Utils.getVal('clima-fecha'), temp_max: Utils.getVal('clima-tmax'),
                temp_min: Utils.getVal('clima-tmin'), humedad_relativa: Utils.getVal('clima-humedad'),
                precipitacion_mm: Utils.getVal('clima-precipitacion'), velocidad_viento: Utils.getVal('clima-viento'),
                notas: Utils.getVal('clima-notas'), fuente: 'manual'
            });
            Utils.toast('✅ Registro climático guardado.');
            Utils.cerrarModal('modal-clima-registro');
            App.cargarPagina('clima');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async simularEstacion() {
        try {
            // Generar 30 días de datos climáticos simulados para Honduras
            for (let i = 29; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const fecha = d.toISOString().split('T')[0];
                const mes = d.getMonth();
                // Temporada lluviosa: mayo-octubre, seca: noviembre-abril
                const lluvioso = mes >= 4 && mes <= 9;
                await window.api.clima.crearRegistro({
                    fecha, fuente: 'simulada',
                    temp_max: Math.round((28 + Math.random() * 6 - (lluvioso ? 2 : 0)) * 10) / 10,
                    temp_min: Math.round((17 + Math.random() * 4) * 10) / 10,
                    humedad_relativa: Math.round((lluvioso ? 75 + Math.random() * 20 : 60 + Math.random() * 20)),
                    precipitacion_mm: Math.round((lluvioso ? Math.random() * 30 : Math.random() * 5) * 10) / 10,
                    velocidad_viento: Math.round((5 + Math.random() * 10) * 10) / 10
                });
            }
            Utils.toast('✅ 30 días de clima simulado generados.');
            App.cargarPagina('clima');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    mostrarFormAlerta() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-clima-alerta';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:450px;">
                <div class="modal-header">
                    <h3>⚠️ Crear Alerta Fitosanitaria</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-clima-alerta')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-alerta" onsubmit="return false;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tipo</label>
                                <select id="alerta-tipo" class="form-control">
                                    <option value="roya">🍂 Roya del Café</option>
                                    <option value="broca">🐛 Broca del Café</option>
                                    <option value="oteada">🌾 Ojeada</option>
                                    <option value="helada">❄️ Helada</option>
                                    <option value="sequia">☀️ Sequía</option>
                                    <option value="inundacion">🌊 Inundación</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Nivel</label>
                                <select id="alerta-nivel" class="form-control">
                                    <option value="bajo">🟢 Bajo</option>
                                    <option value="medio" selected>🟡 Medio</option>
                                    <option value="alto">🔴 Alto</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Lote</label>
                            <select id="alerta-lote" class="form-control"><option value="">General</option></select>
                        </div>
                        <div class="form-group">
                            <label>Recomendación</label>
                            <textarea id="alerta-recomendacion" class="form-control" rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-clima-alerta')">Cancelar</button>
                    <button class="btn btn-success" onclick="Clima.guardarAlerta()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        window.api.lotes.getAll().then(lotes => {
            const select = document.getElementById('alerta-lote');
            if (!select) return;
            lotes.forEach(l => { const o = document.createElement('option'); o.value = l.id; o.textContent = l.codigo; select.appendChild(o); });
        });
    },

    async guardarAlerta() {
        try {
            await window.api.clima.crearAlerta({
                lote_id: Utils.getVal('alerta-lote'), tipo_alerta: document.getElementById('alerta-tipo')?.value,
                nivel: document.getElementById('alerta-nivel')?.value, fecha_inicio: Utils.hoy(),
                recomendacion: Utils.getVal('alerta-recomendacion'), activa: 1
            });
            Utils.toast('✅ Alerta registrada.');
            Utils.cerrarModal('modal-clima-alerta');
            App.cargarPagina('clima');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async resolverAlerta(id) {
        try {
            await window.api.clima.resolverAlerta(id);
            Utils.toast('✅ Alerta resuelta.');
            App.cargarPagina('clima');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    nombreAlerta(tipo) {
        const nombres = { roya: '🍂 Roya del Café', broca: '🐛 Broca del Café', oteada: '🌾 Ojeada', helada: '❄️ Helada', sequia: '☀️ Sequía', inundacion: '🌊 Inundación' };
        return nombres[tipo] || tipo;
    }
};

window.Clima = Clima;
