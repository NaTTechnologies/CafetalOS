// ─── Cafetal OS — Módulo de Sostenibilidad y Huella de Carbono ───

const Sostenibilidad = {
    async cargar(container) {
        try {
            const lotes = await window.api.lotes.getAll();
            const huella = await window.api.huella.getTotal();
            const emisiones = await window.api.huella.getTorta();
            const practicas = await window.api.practicas.getAll();
            const certificaciones = await window.api.certificaciones.getAll();

            container.innerHTML = `
                <div class="page-header">
                    <h2>🌱 Sostenibilidad</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-success" onclick="Sostenibilidad.mostrarFormEmision()">➕ Registrar Emisión</button>
                        <button class="btn btn-outline" onclick="Sostenibilidad.mostrarFormPractica()">🌿 Nueva Práctica</button>
                    </div>
                </div>
                <div class="page-body">
                    <!-- KPI Huella -->
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:var(--verde-hoja);">
                            <div class="kpi-icon">🏭</div>
                            <div class="kpi-value">${Utils.numero(huella.total_co2e || 0, 0)}</div>
                            <div class="kpi-label">kg CO₂e Totales</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:var(--oro-cafe);">
                            <div class="kpi-icon">📋</div>
                            <div class="kpi-value">${huella.registros || 0}</div>
                            <div class="kpi-label">Registros de Emisión</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">🌿</div>
                            <div class="kpi-value">${practicas.length}</div>
                            <div class="kpi-label">Prácticas Regenerativas</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#9C27B0;">
                            <div class="kpi-icon">🏆</div>
                            <div class="kpi-value">${certificaciones.length}</div>
                            <div class="kpi-label">Certificaciones</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <!-- Gráfico de dona: Emisiones por tipo -->
                        <div class="card">
                            <div class="card-header">📊 Distribución de Emisiones CO₂e</div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm">
                                    <canvas id="chartEmisiones"></canvas>
                                </div>
                            </div>
                        </div>
                        <!-- Certificaciones -->
                        <div class="card">
                            <div class="card-header">🏆 Certificaciones</div>
                            <div class="card-body">
                                ${certificaciones.length === 0 ? '<p style="color:var(--cafe-400);">Sin certificaciones registradas.</p>' :
                                    certificaciones.map(c => `
                                        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--cafe-100);">
                                            <div style="font-size:1.5rem;">${Sostenibilidad.iconoCertificacion(c.tipo)}</div>
                                            <div style="flex:1;">
                                                <div style="font-weight:600;text-transform:capitalize;color:var(--cafe-800);">${c.tipo.replace(/_/g, ' ')}</div>
                                                <div style="font-size:0.8rem;color:var(--cafe-400);">${c.entidad_certificadora || ''} ${c.fecha_vencimiento ? '· Vence: ' + c.fecha_vencimiento : ''}</div>
                                            </div>
                                            <span class="badge badge-produccion">${c.activo ? 'Vigente' : 'Inactiva'}</span>
                                        </div>
                                    `).join('')
                                }
                                <div style="margin-top:12px;">
                                    <button class="btn btn-sm btn-outline" onclick="Sostenibilidad.mostrarFormCertificacion()">➕ Agregar Certificación</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Prácticas Regenerativas -->
                    <div class="card mt-4">
                        <div class="card-header">🌿 Prácticas Regenerativas Activas</div>
                        <div class="card-body">
                            ${practicas.length === 0 ? '<p style="color:var(--cafe-400);">No hay prácticas regenerativas registradas.</p>' : `
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Práctica</th><th>Lote</th><th>Área (mz)</th><th>Inicio</th><th>Estado</th><th>Acción</th></tr>
                                        </thead>
                                        <tbody>
                                            ${practicas.map(p => `
                                                <tr>
                                                    <td><strong>${Sostenibilidad.nombrePractica(p.tipo_practica)}</strong></td>
                                                    <td>${Utils.escapar(p.lote_codigo || '—')}</td>
                                                    <td>${Utils.numero(p.area_mz || 0, 1)}</td>
                                                    <td>${p.fecha_inicio || '—'}</td>
                                                    <td><span class="badge badge-produccion">${p.activo ? 'Activa' : 'Inactiva'}</span></td>
                                                    <td><button class="btn btn-sm btn-danger" onclick="Sostenibilidad.eliminarPractica(${p.id})">🗑️</button></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Historial de Emisiones -->
                    <div class="card">
                        <div class="card-header">📋 Historial de Emisiones</div>
                        <div class="card-body">
                            <div id="sostenibilidad-tabla-emisiones">
                                <p style="color:var(--cafe-400);">Cargando...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Reporte EUDR -->
                    <div class="card" style="border-left:4px solid var(--verde-cafe);">
                        <div class="card-header">📄 Reporte EUDR (Deforestación Cero)</div>
                        <div class="card-body">
                            <p style="margin:0 0 8px;font-size:0.85rem;color:var(--cafe-500);">
                                La Unión Europea exige trazabilidad de origen y deforestación cero para importar café. 
                                Genera un reporte con los datos de tu finca, lotes, emisiones y certificaciones.
                            </p>
                            <button class="btn btn-primary" onclick="Sostenibilidad.exportarReporteEUDR()">📥 Exportar Reporte EUDR</button>
                        </div>
                    </div>
                </div>
            `;

            // Gráfico de emisiones
            this.graficoEmisiones(emisiones);
            // Cargar tabla de emisiones
            this.cargarTablaEmisiones();

        } catch (err) {
            console.error('Error cargando sostenibilidad:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar módulo de sostenibilidad.</p></div>`;
        }
    },

    graficoEmisiones(datos) {
        const canvas = document.getElementById('chartEmisiones');
        if (!canvas || !datos.length) return;
        const labelsMap = { fertilizante: 'Fertilizantes', combustible: 'Combustible', energia: 'Energía', transporte: 'Transporte', otros: 'Otros' };
        const colors = ['#2E7D32', '#FF8F00', '#1565C0', '#795548', '#9E9E9E'];
        if (window.SostenibilidadChart) window.SostenibilidadChart.destroy();
        window.SostenibilidadChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: datos.map(d => labelsMap[d.tipo_emision] || d.tipo_emision),
                datasets: [{
                    data: datos.map(d => d.total),
                    backgroundColor: colors.slice(0, datos.length),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 } } }
                }
            }
        });
    },

    async cargarTablaEmisiones() {
        const container = document.getElementById('sostenibilidad-tabla-emisiones');
        if (!container) return;
        try {
            const datos = await window.api.huella.getAll();
            if (!datos.length) {
                container.innerHTML = '<p style="color:var(--cafe-400);">No hay emisiones registradas. ¡Registra la primera!</p>';
                return;
            }
            const labelsMap = { fertilizante: 'Fertilizante', combustible: 'Combustible', energia: 'Energía', transporte: 'Transporte', otros: 'Otros' };
            container.innerHTML = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Fecha</th><th>Lote</th><th>Tipo</th><th>Cantidad (kg)</th><th>CO₂e (kg)</th><th>Factor</th><th>Notas</th></tr>
                        </thead>
                        <tbody>
                            ${datos.map(d => `
                                <tr>
                                    <td>${d.fecha}</td>
                                    <td>${Utils.escapar(d.lote_codigo || 'General')}</td>
                                    <td>${labelsMap[d.tipo_emision] || d.tipo_emision}</td>
                                    <td>${Utils.numero(d.cantidad_kg, 1)}</td>
                                    <td><strong>${Utils.numero(d.co2e_kg, 1)}</strong></td>
                                    <td>${d.co2e_kg > 0 && d.cantidad_kg > 0 ? (d.co2e_kg / d.cantidad_kg).toFixed(1) + 'x' : '—'}</td>
                                    <td style="font-size:0.8rem;color:var(--cafe-400);">${Utils.escapar(d.notas || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            container.innerHTML = '<p style="color:var(--rojo-cafe);">Error al cargar emisiones.</p>';
        }
    },

    // ─── Formularios ───

    mostrarFormEmision() {
        const modal = document.getElementById('modal-sostenibilidad-emision');
        if (modal) { modal.classList.add('active'); return; }
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-sostenibilidad-emision';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>🏭 Registrar Emisión de Carbono</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-sostenibilidad-emision')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-emision" onsubmit="return false;">
                        <div class="form-group">
                            <label>Lote</label>
                            <select id="emision-lote" class="form-control">
                                <option value="">General (sin lote específico)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Emisión</label>
                            <select id="emision-tipo" class="form-control">
                                <option value="fertilizante">🌱 Fertilizante (factor: 4.5 kg CO₂e/kg)</option>
                                <option value="combustible">⛽ Combustible (factor: 3.2 kg CO₂e/kg)</option>
                                <option value="energia">⚡ Energía (factor: 0.5 kg CO₂e/kg)</option>
                                <option value="transporte">🚛 Transporte (factor: 0.8 kg CO₂e/kg)</option>
                                <option value="otros">📦 Otros (factor: 1.0 kg CO₂e/kg)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cantidad (kg)</label>
                            <input type="number" id="emision-cantidad" class="form-control" step="0.1" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Notas</label>
                            <input type="text" id="emision-notas" class="form-control" placeholder="ej: 10 sacos de 15-15-15">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-sostenibilidad-emision')">Cancelar</button>
                    <button class="btn btn-success" onclick="Sostenibilidad.guardarEmision()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Cargar lotes
        window.api.lotes.getAll().then(lotes => {
            const select = document.getElementById('emision-lote');
            lotes.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id; opt.textContent = `${l.codigo} — ${l.variedad_nombre || ''}`;
                select.appendChild(opt);
            });
        });
    },

    async guardarEmision() {
        const lote_id = Utils.getVal('emision-lote');
        const tipo_emision = document.getElementById('emision-tipo')?.value;
        const cantidad_kg = Utils.getVal('emision-cantidad');
        const notas = Utils.getVal('emision-notas');
        if (!tipo_emision || !cantidad_kg) { Utils.toast('⚠️ Completa todos los campos requeridos.', 'error'); return; }
        try {
            await window.api.huella.create({ lote_id, fecha: Utils.hoy(), tipo_emision, cantidad_kg, notas });
            Utils.toast('✅ Emisión registrada. CO₂e calculado automáticamente.');
            Utils.cerrarModal('modal-sostenibilidad-emision');
            App.cargarPagina('sostenibilidad');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    mostrarFormPractica() {
        const modal = document.getElementById('modal-sostenibilidad-practica');
        if (modal) { modal.classList.add('active'); return; }
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-sostenibilidad-practica';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>🌿 Nueva Práctica Regenerativa</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-sostenibilidad-practica')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-practica" onsubmit="return false;">
                        <div class="form-group">
                            <label>Lote</label>
                            <select id="practica-lote" class="form-control"><option value="">General</option></select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Práctica</label>
                            <select id="practica-tipo" class="form-control">
                                <option value="compostaje">♻️ Compostaje</option>
                                <option value="agroforesteria">🌳 Agroforestería</option>
                                <option value="cobertura">🌾 Cobertura Vegetal</option>
                                <option value="curvas_nivel">〰️ Curvas a Nivel</option>
                                <option value="barreras_vivas">🌿 Barreras Vivas</option>
                                <option value="cortinas_rompevientos">🌲 Cortinas Rompevientos</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Área (mz)</label>
                                <input type="number" id="practica-area" class="form-control" step="0.1" min="0">
                            </div>
                            <div class="form-group">
                                <label>Fecha de Inicio</label>
                                <input type="date" id="practica-fecha" class="form-control" value="${Utils.hoy()}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notas</label>
                            <textarea id="practica-notas" class="form-control" rows="3"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-sostenibilidad-practica')">Cancelar</button>
                    <button class="btn btn-success" onclick="Sostenibilidad.guardarPractica()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        window.api.lotes.getAll().then(lotes => {
            const select = document.getElementById('practica-lote');
            lotes.forEach(l => { const opt = document.createElement('option'); opt.value = l.id; opt.textContent = l.codigo; select.appendChild(opt); });
        });
    },

    async guardarPractica() {
        const data = {
            lote_id: Utils.getVal('practica-lote'),
            tipo_practica: document.getElementById('practica-tipo')?.value,
            area_mz: Utils.getVal('practica-area'),
            fecha_inicio: Utils.getVal('practica-fecha'),
            notas: Utils.getVal('practica-notas'),
            activo: 1
        };
        if (!data.tipo_practica) { Utils.toast('⚠️ Selecciona un tipo de práctica.', 'error'); return; }
        try {
            await window.api.practicas.create(data);
            Utils.toast('✅ Práctica regenerativa registrada.');
            Utils.cerrarModal('modal-sostenibilidad-practica');
            App.cargarPagina('sostenibilidad');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async eliminarPractica(id) {
        if (!await Utils.confirmar('¿Desactivar esta práctica regenerativa?')) return;
        await window.api.practicas.delete(id);
        Utils.toast('✅ Práctica desactivada.');
        App.cargarPagina('sostenibilidad');
    },

    mostrarFormCertificacion() {
        // Similar pattern - reuses the modal
        const modal = document.getElementById('modal-sostenibilidad-cert');
        if (modal) { modal.classList.add('active'); return; }
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-sostenibilidad-cert';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>🏆 Nueva Certificación</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-sostenibilidad-cert')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-cert" onsubmit="return false;">
                        <div class="form-group">
                            <label>Tipo</label>
                            <select id="cert-tipo" class="form-control">
                                <option value="organico">🌱 Orgánico</option>
                                <option value="rainforest">🐸 Rainforest Alliance</option>
                                <option value="comercio_justo">🤝 Comercio Justo</option>
                                <option value="utz">✅ UTZ</option>
                                <option value="carbon_neutral">🌍 Carbono Neutral</option>
                                <option value="bird_friendly">🐦 Bird Friendly</option>
                                <option value="4c">📋 C.A.F.E. Practices</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Entidad Certificadora</label>
                            <input type="text" id="cert-entidad" class="form-control" placeholder="ej: Control Union, FLO, etc.">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Fecha de Obtención</label>
                                <input type="date" id="cert-obtencion" class="form-control" value="${Utils.hoy()}">
                            </div>
                            <div class="form-group">
                                <label>Fecha de Vencimiento</label>
                                <input type="date" id="cert-vencimiento" class="form-control">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-sostenibilidad-cert')">Cancelar</button>
                    <button class="btn btn-success" onclick="Sostenibilidad.guardarCertificacion()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async guardarCertificacion() {
        const data = {
            finca_id: 1,
            tipo: document.getElementById('cert-tipo')?.value,
            entidad_certificadora: Utils.getVal('cert-entidad'),
            fecha_obtencion: Utils.getVal('cert-obtencion'),
            fecha_vencimiento: Utils.getVal('cert-vencimiento'),
            activo: 1
        };
        if (!data.tipo) { Utils.toast('⚠️ Selecciona un tipo de certificación.', 'error'); return; }
        try {
            await window.api.certificaciones.create(data);
            Utils.toast('✅ Certificación registrada.');
            Utils.cerrarModal('modal-sostenibilidad-cert');
            App.cargarPagina('sostenibilidad');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async exportarReporteEUDR() {
        try {
            const finca = await window.api.finca.get() || {};
            const lotes = await window.api.lotes.getAll();
            const certificaciones = await window.api.certificaciones.getAll();
            const huella = await window.api.huella.getTotal();

            let contenido = `REPORTE EUDR (Deforestación Cero) - Cafetal OS\n\n` +
                `Finca: ${finca.nombre || 'Sin nombre'}\n` +
                `Ubicación: ${finca.ubicacion || 'No especificada'}\n` +
                `Altitud: ${finca.altitud_msnm || 'N/A'} msnm\n` +
                `Área Total: ${finca.area_total_mz || 0} mz\n` +
                `Área Café: ${finca.area_cafe_mz || 0} mz\n\n` +
                `CERTIFICACIONES:\n${certificaciones.map(c => `- ${c.tipo}: ${c.entidad_certificadora || '—'} (${c.fecha_obtencion || '—'})`).join('\n') || '—'}\n\n` +
                `LOTES (${lotes.length}):\n${lotes.map(l => `- ${l.codigo}: ${l.area_mz} mz, ${l.variedad_nombre || '—'}, ${l.estado}`).join('\n')}\n\n` +
                `HUELLA DE CARBONO: ${Utils.numero(huella.total_co2e || 0, 1)} kg CO₂e total\n\n` +
                `--- Generado por Cafetal OS v1.0 el ${Utils.hoy()} ---\n` +
                `Conforme a Regulación (UE) 2023/1115 sobre deforestación.`;

            const result = await window.api.exportar.pdf({ tipo: 'eudr', titulo: `EUDR_${finca.nombre || 'Finca'}`, contenidoHtml: contenido });
            if (result) Utils.toast(`✅ Reporte EUDR guardado: ${result}`);
        } catch (err) {
            Utils.toast('❌ Error al exportar: ' + err.message, 'error');
        }
    },

    // ─── Helpers ───
    iconoCertificacion(tipo) {
        const icons = { organico: '🌱', rainforest: '🐸', comercio_justo: '🤝', utz: '✅', carbon_neutral: '🌍', bird_friendly: '🐦', '4c': '📋' };
        return icons[tipo] || '🏆';
    },

    nombrePractica(tipo) {
        const nombres = { compostaje: '♻️ Compostaje', agroforesteria: '🌳 Agroforestería', cobertura: '🌾 Cobertura Vegetal', curvas_nivel: '〰️ Curvas a Nivel', barreras_vivas: '🌿 Barreras Vivas', cortinas_rompevientos: '🌲 Cortinas Rompevientos' };
        return nombres[tipo] || tipo;
    }
};

window.Sostenibilidad = Sostenibilidad;
