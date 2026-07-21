// ─── Módulo: Lotes ───

const Lotes = {
    datos: [],
    historialCache: null,

    async cargar(container) {
        try {
            this.datos = await window.api.lotes.getAll();
            const variedades = await window.api.variedades.getAll();
            const resumen = await window.api.lotes.getResumen();
            
            container.innerHTML = `
                <div class="page-header">
                    <h2>🌳 Lotes / Parcelas</h2>
                    <button class="btn btn-success" onclick="Lotes.nuevo()">+ Nuevo Lote</button>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card kpi-green">
                            <div class="kpi-value">${resumen.total_lotes}</div>
                            <div class="kpi-label">Total Lotes</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value">${Utils.numero(resumen.total_area, 1)} mz</div>
                            <div class="kpi-label">Área Total</div>
                        </div>
                        <div class="kpi-card kpi-gold">
                            <div class="kpi-value">${resumen.en_produccion}</div>
                            <div class="kpi-label">En Producción</div>
                        </div>
                    </div>

                    <!-- Alertas fitosanitarias -->
                    <div id="lotes-alertas-container"></div>

                    <div class="card">
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Área (mz)</th>
                                            <th>Variedad</th>
                                            <th>Año Siembra</th>
                                            <th>Altitud</th>
                                            <th>Estado</th>
                                            <th>Total Latas</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.datos.length === 0 ? 
                                            '<tr><td colspan="8" class="text-center" style="padding:30px;color:var(--cafe-400);">No hay lotes registrados. ¡Crea tu primer lote!</td></tr>' :
                                            this.datos.map(l => `
                                                <tr>
                                                    <td><strong>${Utils.escapar(l.codigo)}</strong></td>
                                                    <td>${Utils.numero(l.area_mz, 1)}</td>
                                                    <td>${Utils.escapar(l.variedad_nombre || 'Sin definir')}</td>
                                                    <td>${l.año_siembra || '-'}</td>
                                                    <td>${l.altitud_lote_msnm ? l.altitud_lote_msnm + ' msnm' : '-'}</td>
                                                    <td><span class="badge badge-${l.estado}">${l.estado}</span></td>
                                                    <td>${l.total_latas ? Utils.numero(l.total_latas, 0) : '0'}</td>
                                                    <td>
                                                        <button class="btn-icon" onclick="Lotes.verDetalle(${l.id})" title="Ver detalle">📋</button>
                                                        <button class="btn-icon" onclick="Lotes.editar(${l.id})" title="Editar">✏️</button>
                                                        <button class="btn-icon" onclick="Lotes.eliminar(${l.id})" title="Eliminar">🗑️</button>
                                                    </td>
                                                </tr>
                                            `).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo/Editar Lote -->
                <div id="modal-lote" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-lote-titulo">Nuevo Lote</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-lote')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="lote-id">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Código del Lote *</label>
                                    <input type="text" id="lote-codigo" class="form-control" 
                                        placeholder="Ej: A-Montaña, B-Río" required>
                                </div>
                                <div class="form-group">
                                    <label>Área (Manzanas) *</label>
                                    <input type="number" id="lote-area" class="form-control" step="0.1" 
                                        placeholder="Ej: 3.5" required>
                                </div>
                                <div class="form-group">
                                    <label>Variedad</label>
                                    <select id="lote-variedad" class="form-control"></select>
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Año de Siembra</label>
                                    <input type="number" id="lote-año" class="form-control" 
                                        placeholder="Ej: 2018" min="1900" max="${Utils.añoActual()}">
                                </div>
                                <div class="form-group">
                                    <label>Densidad (plantas/mz)</label>
                                    <input type="number" id="lote-densidad" class="form-control" 
                                        placeholder="Ej: 5000">
                                </div>
                                <div class="form-group">
                                    <label>Altitud del Lote (msnm)</label>
                                    <input type="number" id="lote-altitud" class="form-control" 
                                        placeholder="Ej: 1250">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Exposición Solar</label>
                                    <select id="lote-exposicion" class="form-control">
                                        <option value="">Seleccionar...</option>
                                        <option value="Norte">Norte</option>
                                        <option value="Sur">Sur</option>
                                        <option value="Este">Este</option>
                                        <option value="Oeste">Oeste</option>
                                        <option value="Plano">Plano</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Suelo</label>
                                    <select id="lote-suelo" class="form-control">
                                        <option value="">Seleccionar...</option>
                                        <option value="Franco">Franco</option>
                                        <option value="Franco arenoso">Franco arenoso</option>
                                        <option value="Franco arcilloso">Franco arcilloso</option>
                                        <option value="Arcilloso">Arcilloso</option>
                                        <option value="Arenoso">Arenoso</option>
                                        <option value="Limoso">Limoso</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Estado</label>
                                    <select id="lote-estado" class="form-control">
                                        <option value="produccion">Producción</option>
                                        <option value="reposicion">Reposición</option>
                                        <option value="descanso">Descanso</option>
                                        <option value="nuevo">Nuevo</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Observaciones</label>
                                <textarea id="lote-observaciones" class="form-control" rows="2" 
                                    placeholder="Notas adicionales..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-lote')">Cancelar</button>
                            <button class="btn btn-primary" onclick="Lotes.guardar()">💾 Guardar Lote</button>
                        </div>
                    </div>
                </div>
            `;

            // Cargar variedades en el select
            await Utils.cargarSelect('lote-variedad', variedades, 'id', 'nombre', 'Seleccionar variedad...');

            // Cargar alertas fitosanitarias activas
            Lotes.cargarAlertas();

            // Modal Ficha de Lote (FLUJO 3)
            const modalHistorial = document.createElement('div');
            modalHistorial.id = 'modal-lote-historial';
            modalHistorial.className = 'modal-overlay';
            modalHistorial.innerHTML = `
                <div class="modal-content" style="max-width:700px;">
                    <div class="modal-header">
                        <h3 id="historial-lote-titulo">📋 Detalle del Lote</h3>
                        <button class="modal-close" onclick="Utils.cerrarModal('modal-lote-historial')">&times;</button>
                    </div>
                    <div class="modal-body" id="historial-lote-body" style="max-height:60vh;overflow-y:auto;">
                        <p style="text-align:center;color:var(--cafe-400);">Cargando...</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-lote-historial')">Cerrar</button>
                    </div>
                </div>
            `;
            container.appendChild(modalHistorial);
            
        } catch (err) {
            console.error('Error cargando lotes:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar lotes.</p></div>`;
        }
    },

    // ★ FLUJO 3: Ver ficha completa del lote
    async verDetalle(id) {
        try {
            this.historialCache = await window.api.lotes.getHistorial(id);
            const h = this.historialCache;
            const l = h.lote;

            document.getElementById('historial-lote-titulo').textContent = `📋 ${l.codigo} — Detalle Completo`;

            const labelsMap = {
                'cereza': '🍒 Cereza', 'pergamino_humedo': '💧 Perg. Húmedo',
                'pergamino_seco': '🟤 Perg. Seco', 'verde': '🟢 Verde', 'tostado': '☕ Tostado'
            };

            let html = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div class="card" style="margin:0;">
                        <div class="card-header">📐 Datos del Lote</div>
                        <div class="card-body" style="padding:12px;">
                            <table style="font-size:0.85rem;width:100%;">
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Variedad</td><td style="padding:4px 8px;font-weight:600;">${Utils.escapar(l.variedad_nombre || 'Sin definir')}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Área</td><td style="padding:4px 8px;font-weight:600;">${Utils.numero(l.area_mz, 1)} mz</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Año siembra</td><td style="padding:4px 8px;font-weight:600;">${l.año_siembra || '-'}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Altitud</td><td style="padding:4px 8px;font-weight:600;">${l.altitud_lote_msnm ? l.altitud_lote_msnm + ' msnm' : '-'}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Suelo</td><td style="padding:4px 8px;font-weight:600;">${l.tipo_suelo || '-'}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Estado</td><td style="padding:4px 8px;"><span class="badge badge-${l.estado}">${l.estado}</span></td></tr>
                            </table>
                        </div>
                    </div>
                    <div class="card" style="margin:0;">
                        <div class="card-header">📊 Resumen Productivo</div>
                        <div class="card-body" style="padding:12px;">
                            <table style="font-size:0.85rem;width:100%;">
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Total cortes</td><td style="padding:4px 8px;font-weight:600;">${h.resumen.total_cortes}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Total latas</td><td style="padding:4px 8px;font-weight:600;">${Utils.numero(h.resumen.total_latas, 0)}</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Total kilos</td><td style="padding:4px 8px;font-weight:600;">${Utils.numero(h.resumen.total_kilos, 0)} kg</td></tr>
                                <tr><td style="padding:4px 8px;color:var(--cafe-500);">Pagado cosecha</td><td style="padding:4px 8px;font-weight:600;">${Utils.moneda(h.resumen.total_pagado_cosecha)}</td></tr>
                            </table>
                        </div>
                    </div>
                </div>`;

            // Cosechas recientes
            html += `<div class="card" style="margin-bottom:12px;">
                <div class="card-header">📅 Últimas Cosechas (${h.cosechas.length})</div>
                <div class="card-body" style="padding:0;">
                    <div style="max-height:160px;overflow-y:auto;">
                        <table style="font-size:0.8rem;">
                            <thead><tr><th>Fecha</th><th>Recolector</th><th>Latas</th><th>Kilos</th><th>Pagado</th></tr></thead>
                            <tbody>
                                ${h.cosechas.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:12px;color:var(--cafe-400);">Sin cosechas registradas</td></tr>' :
                                    h.cosechas.map(c => `<tr>
                                        <td>${Utils.formatearFecha(c.fecha)}</td>
                                        <td>${Utils.escapar(c.recolector_nombre || '-')}</td>
                                        <td>${Utils.numero(c.latas_recolectadas, 0)}</td>
                                        <td>${Utils.numero(c.kilos_estimados, 0)}</td>
                                        <td>${Utils.moneda(c.total_pagado)}</td>
                                    </tr>`).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            // Beneficios
            html += `<div class="card" style="margin-bottom:12px;">
                <div class="card-header">🔄 Beneficios (${h.beneficios.length})</div>
                <div class="card-body" style="padding:0;">
                    <div style="max-height:160px;overflow-y:auto;">
                        <table style="font-size:0.8rem;">
                            <thead><tr><th>Fecha</th><th>Cereza (kg)</th><th>Pergamino (kg)</th><th>Rendimiento</th><th>Método</th></tr></thead>
                            <tbody>
                                ${h.beneficios.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:12px;color:var(--cafe-400);">Sin beneficios registrados</td></tr>' :
                                    h.beneficios.map(b => {
                                        const ind = b.rendimiento_porcentaje ? Utils.indicadorRendimiento(b.rendimiento_porcentaje) : { clase: '', texto: '-' };
                                        return `<tr>
                                            <td>${Utils.formatearFecha(b.fecha_inicio)}</td>
                                            <td>${Utils.numero(b.kilos_cereza_ingresados, 0)}</td>
                                            <td><strong>${Utils.numero(b.kilos_pergamino_seco, 0)}</strong></td>
                                            <td><span class="rend-badge ${ind.clase}">${ind.texto}</span></td>
                                            <td>${b.metodo || '-'}</td>
                                        </tr>`;
                                    }).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            // Gastos
            html += `<div class="card" style="margin-bottom:12px;">
                <div class="card-header">💰 Gastos (${h.gastos.length})</div>
                <div class="card-body" style="padding:0;">
                    <div style="max-height:160px;overflow-y:auto;">
                        <table style="font-size:0.8rem;">
                            <thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Total</th></tr></thead>
                            <tbody>
                                ${h.gastos.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--cafe-400);">Sin gastos asignados</td></tr>' :
                                    h.gastos.map(g => `<tr>
                                        <td>${Utils.formatearFecha(g.fecha)}</td>
                                        <td>${g.categoria}</td>
                                        <td>${Utils.escapar(g.descripcion)}</td>
                                        <td><strong>${Utils.moneda(g.costo_total)}</strong></td>
                                    </tr>`).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

            // Inventario
            if (h.inventario.length > 0) {
                html += `<div class="card">
                    <div class="card-header">📦 Inventario relacionado (${h.inventario.length})</div>
                    <div class="card-body" style="padding:0;">
                        <div style="max-height:160px;overflow-y:auto;">
                            <table style="font-size:0.8rem;">
                                <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th></tr></thead>
                                <tbody>
                                    ${h.inventario.map(i => `<tr>
                                        <td>${Utils.formatearFecha(i.fecha_movimiento)}</td>
                                        <td>${labelsMap[i.tipo_producto] || i.tipo_producto}</td>
                                        <td><span class="badge ${i.tipo_movimiento === 'entrada' ? 'badge-produccion' : 'badge-descanso'}">${i.tipo_movimiento}</span></td>
                                        <td>${Utils.numero(i.cantidad_qq, 1)} qq</td>
                                    </tr>`).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>`;
            }

            if (l.observaciones) {
                html += `<div style="margin-top:12px;padding:12px;background:var(--cafe-50);border-radius:6px;font-size:0.85rem;color:var(--cafe-600);">
                    <strong>📝 Observaciones:</strong> ${Utils.escapar(l.observaciones)}
                </div>`;
            }

            document.getElementById('historial-lote-body').innerHTML = html;
            Utils.mostrarModal('modal-lote-historial');

        } catch (err) {
            Utils.toast('❌ Error al cargar detalle del lote: ' + err.message, 'error');
        }
    },

    nuevo() {
        Utils.limpiarForm('modal-lote');
        Validador.limpiarForm('modal-lote');
        document.getElementById('lote-id').value = '';
        document.getElementById('modal-lote-titulo').textContent = '🌳 Nuevo Lote';
        Utils.mostrarModal('modal-lote');
    },

    async editar(id) {
        try {
            const lote = await window.api.lotes.getById(id);
            if (!lote) { Utils.toast('Lote no encontrado', 'error'); return; }
            
            document.getElementById('modal-lote-titulo').textContent = '✏️ Editar Lote';
            Utils.setVal('lote-id', lote.id);
            Utils.setVal('lote-codigo', lote.codigo);
            Utils.setVal('lote-area', lote.area_mz);
            Utils.setVal('lote-variedad', lote.variedad_id || '');
            Utils.setVal('lote-año', lote.año_siembra);
            Utils.setVal('lote-densidad', lote.densidad_plantas_mz);
            Utils.setVal('lote-altitud', lote.altitud_lote_msnm);
            Utils.setVal('lote-exposicion', lote.exposicion || '');
            Utils.setVal('lote-suelo', lote.tipo_suelo || '');
            Utils.setVal('lote-estado', lote.estado || 'produccion');
            Utils.setVal('lote-observaciones', lote.observaciones || '');
            
            Utils.mostrarModal('modal-lote');
        } catch (err) {
            Utils.toast('Error al cargar lote: ' + err.message, 'error');
        }
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'lote-codigo': ['required'],
            'lote-area': ['required', 'positive'],
            'lote-año': ['number', ['min', 1900], ['max', Utils.añoActual() + 1]],
            'lote-densidad': ['number', 'positive'],
            'lote-altitud': ['number', 'positive']
        };
        if (!Validador.validarForm(campos)) return;

        const data = {
            finca_id: 1,
            codigo: Utils.getVal('lote-codigo'),
            area_mz: Utils.getVal('lote-area'),
            variedad_id: Utils.getVal('lote-variedad'),
            año_siembra: Utils.getVal('lote-año'),
            densidad_plantas_mz: Utils.getVal('lote-densidad'),
            altitud_lote_msnm: Utils.getVal('lote-altitud'),
            exposicion: Utils.getVal('lote-exposicion'),
            tipo_suelo: Utils.getVal('lote-suelo'),
            estado: Utils.getVal('lote-estado') || 'produccion',
            observaciones: Utils.getVal('lote-observaciones')
        };

        try {
            const id = Utils.getVal('lote-id');
            if (id) {
                await window.api.lotes.update(id, data);
                Utils.toast('✅ Lote actualizado correctamente');
            } else {
                await window.api.lotes.create(data);
                Utils.toast('✅ Lote creado correctamente');
            }
            Utils.cerrarModal('modal-lote');
            App.cargarPagina('lotes');
        } catch (err) {
            Utils.toast('❌ Error al guardar: ' + err.message, 'error');
        }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Estás seguro de eliminar este lote? Los registros asociados se conservarán.')) return;
        try {
            await window.api.lotes.delete(id);
            Utils.toast('✅ Lote eliminado');
            App.cargarPagina('lotes');
        } catch (err) {
            Utils.toast('❌ Error al eliminar: ' + err.message, 'error');
        }
    },

    async cargarAlertas() {
        const container = document.getElementById('lotes-alertas-container');
        if (!container) return;
        try {
            const alertas = await window.api.clima.getAlertas();
            if (!alertas || alertas.length === 0) { container.innerHTML = ''; return; }
            const nivelIcono = { alto: '🔴', medio: '🟡', bajo: '🟢' };
            const nombreAlerta = { roya: 'Roya del Café', broca: 'Broca del Café', oteada: 'Ojeada', helada: 'Helada', sequia: 'Sequía', inundacion: 'Inundación' };
            container.innerHTML = `
                <div class="card" style="margin-bottom:16px;background:#FFF3E0;border:1px solid var(--oro-cafe);">
                    <div class="card-body" style="padding:12px 16px;">
                        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                            <span style="font-weight:600;color:var(--cafe-800);">⚠️ Alertas Activas (${alertas.length})</span>
                            ${alertas.slice(0, 3).map(a => `
                                <span class="badge" style="background:${a.nivel === 'alto' ? '#FFEBEE' : a.nivel === 'medio' ? '#FFF3E0' : '#E8F5E9'};color:${a.nivel === 'alto' ? '#C62828' : a.nivel === 'medio' ? '#E65100' : '#2E7D32'};">
                                    ${nivelIcono[a.nivel] || ''} ${nombreAlerta[a.tipo_alerta] || a.tipo_alerta} ${a.lote_codigo ? '· ' + a.lote_codigo : ''}
                                </span>
                            `).join('')}
                            ${alertas.length > 3 ? `<span style="font-size:0.8rem;color:var(--cafe-400);">+${alertas.length - 3} más</span>` : ''}
                            <a href="#" onclick="App.cargarPagina('clima');return false;" style="font-size:0.8rem;color:var(--cafe-600);margin-left:auto;">Ver todas →</a>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) { container.innerHTML = ''; }
    }
};

window.Lotes = Lotes;
