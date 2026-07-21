// ─── Módulo: Beneficio (Procesamiento) ───

const Beneficio = {
    // Datos de cosecha precargados (FLUJO 2)
    cosechasDisponibles: [],

    async cargar(container) {
        try {
            // Precargar cosechas recientes para el botón "Cargar desde Cosecha"
            try {
                const fin = Utils.hoy();
                const inicio = new Date();
                inicio.setDate(inicio.getDate() - 30);
                this.cosechasDisponibles = await window.api.cosecha.getResumenPorPeriodo(
                    inicio.toISOString().split('T')[0], fin
                );
            } catch(e) { this.cosechasDisponibles = []; }

            const lotes = await window.api.lotes.getAll();
            const procesos = await window.api.beneficio.getAll();
            const rendLotes = await window.api.beneficio.rendimientoPorLote();
            
            container.innerHTML = `
                <div class="page-header">
                    <h2>🔄 Beneficio / Procesamiento</h2>
                    <button class="btn btn-success" onclick="Beneficio.nuevo()">+ Nuevo Proceso</button>
                </div>
                <div class="page-body">
                    <div class="card">
                        <div class="card-header">📐 Rendimiento por Lote</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Lote</th>
                                            <th>Procesos</th>
                                            <th>Rend. Promedio</th>
                                            <th>Total Pergamino</th>
                                            <th>Indicador</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rendLotes.length === 0 ?
                                            '<tr><td colspan="5" class="text-center" style="padding:20px;color:var(--cafe-400);">Sin datos de rendimiento.</td></tr>' :
                                            rendLotes.map(r => {
                                                const ind = Utils.indicadorRendimiento(r.rend_promedio);
                                                return `<tr>
                                                    <td><strong>${Utils.escapar(r.codigo)}</strong></td>
                                                    <td>${r.procesos}</td>
                                                    <td>${Utils.numero(r.rend_promedio, 1)}%</td>
                                                    <td>${Utils.numero(r.total_pergamino, 0)} kg</td>
                                                    <td><span class="rend-badge ${ind.clase}">${ind.texto}</span></td>
                                                </tr>`;
                                            }).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">📋 Historial de Procesos</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Lote</th>
                                            <th>Cereza (kg)</th>
                                            <th>Pergamino (kg)</th>
                                            <th>Rendimiento</th>
                                            <th>Método</th>
                                            <th>Secado</th>
                                            <th>Humedad</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${procesos.length === 0 ?
                                            '<tr><td colspan="9" class="text-center" style="padding:20px;color:var(--cafe-400);">No hay procesos registrados.</td></tr>' :
                                            procesos.map(p => {
                                                const ind = Utils.indicadorRendimiento(p.rendimiento_porcentaje);
                                                return `<tr>
                                                    <td>${Utils.formatearFecha(p.fecha_inicio)}</td>
                                                    <td>${Utils.escapar(p.lote_codigo)}</td>
                                                    <td>${Utils.numero(p.kilos_cereza_ingresados, 0)}</td>
                                                    <td><strong>${Utils.numero(p.kilos_pergamino_seco, 0)}</strong></td>
                                                    <td><span class="rend-badge ${ind.clase}">${p.rendimiento_porcentaje ? Utils.numero(p.rendimiento_porcentaje, 1) + '%' : '-'}</span></td>
                                                    <td>${p.metodo || '-'}</td>
                                                    <td>${p.tipo_secado || '-'}</td>
                                                    <td>${p.humedad_final_porcentaje ? p.humedad_final_porcentaje + '%' : '-'}</td>
                                                    <td><button class="btn-icon" onclick="Beneficio.eliminar(${p.id})" title="Eliminar">🗑️</button></td>
                                                </tr>`;
                                            }).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo Proceso -->
                <div id="modal-beneficio" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🔄 Nuevo Proceso de Beneficio</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-beneficio')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Lote de Origen *</label>
                                    <select id="beneficio-lote" class="form-control" required></select>
                                    <button type="button" class="btn btn-outline btn-sm" onclick="Beneficio.mostrarCosechas()" style="margin-top:6px;width:100%;font-size:0.8rem;">
                                        📋 Cargar desde Cosecha
                                    </button>
                                </div>
                                <div class="form-group">
                                    <label>Fecha Inicio *</label>
                                    <input type="date" id="beneficio-fecha-ini" class="form-control" value="${Utils.hoy()}">
                                </div>
                                <div class="form-group">
                                    <label>Fecha Fin</label>
                                    <input type="date" id="beneficio-fecha-fin" class="form-control" value="${Utils.hoy()}">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Kilos de Cereza Ingresados *</label>
                                    <input type="number" id="beneficio-cereza" class="form-control" step="0.1"
                                        placeholder="Ej: 1500" oninput="Beneficio.calcular()">
                                </div>
                                <div class="form-group">
                                    <label>Kilos Pergamino Obtenido *</label>
                                    <input type="number" id="beneficio-pergamino" class="form-control" step="0.1"
                                        placeholder="Ej: 340" oninput="Beneficio.calcular()">
                                </div>
                                <div class="form-group">
                                    <label>Rendimiento</label>
                                    <input type="text" id="beneficio-rendimiento" class="form-control" readonly
                                        style="font-weight:700;color:var(--cafe-800);background:var(--cafe-50);">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Método</label>
                                    <select id="beneficio-metodo" class="form-control">
                                        <option value="lavado">Lavado</option>
                                        <option value="honey">Honey</option>
                                        <option value="natural">Natural</option>
                                        <option value="semi-lavado">Semi-lavado</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Horas de Fermentación</label>
                                    <input type="number" id="beneficio-fermentacion" class="form-control" step="0.5"
                                        placeholder="Ej: 18">
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Secado</label>
                                    <select id="beneficio-secado" class="form-control">
                                        <option value="sol">Sol</option>
                                        <option value="mecanico">Mecánico</option>
                                        <option value="combinado">Combinado</option>
                                        <option value="silo">Silo</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Días de Secado</label>
                                    <input type="number" id="beneficio-dias" class="form-control" placeholder="Ej: 12">
                                </div>
                                <div class="form-group">
                                    <label>Humedad Final (%)</label>
                                    <input type="number" id="beneficio-humedad" class="form-control" step="0.1"
                                        placeholder="10-12%">
                                </div>
                                <div class="form-group"></div>
                            </div>
                            <div class="form-group">
                                <label>Observaciones</label>
                                <textarea id="beneficio-observaciones" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-beneficio')">Cancelar</button>
                            <button class="btn btn-primary" onclick="Beneficio.guardar()">💾 Registrar Proceso</button>
                        </div>
                    </div>
                </div>
            `;

            await Utils.cargarSelect('beneficio-lote', lotes, 'id', 'codigo', 'Seleccionar lote...');

            <!-- Modal Cargar desde Cosecha (FLUJO 2) -->
            const modalCosecha = document.createElement('div');
            modalCosecha.id = 'modal-cosecha-beneficio';
            modalCosecha.className = 'modal-overlay';
            modalCosecha.innerHTML = `
                <div class="modal-content" style="max-width:500px;">
                    <div class="modal-header">
                        <h3>📋 Cosecha Reciente (30 días)</h3>
                        <button class="modal-close" onclick="Utils.cerrarModal('modal-cosecha-beneficio')">&times;</button>
                    </div>
                    <div class="modal-body" id="cosecha-beneficio-body">
                        <p style="color:var(--cafe-400);text-align:center;">Cargando datos de cosecha...</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-cosecha-beneficio')">Cancelar</button>
                    </div>
                </div>
            `;
            container.appendChild(modalCosecha);

        } catch (err) {
            console.error('Error cargando beneficio:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar beneficio.</p></div>`;
        }
    },

    // ★ FLUJO 2: Mostrar cosechas disponibles y permitir cargar al formulario
    mostrarCosechas() {
        const body = document.getElementById('cosecha-beneficio-body');
        if (!body) return;

        if (!this.cosechasDisponibles || this.cosechasDisponibles.length === 0) {
            body.innerHTML = `<div style="text-align:center;padding:30px;color:var(--cafe-400);">
                <div style="font-size:2rem;margin-bottom:12px;">📭</div>
                <p>No hay cosechas registradas en los últimos 30 días.<br>Registra cortes en "Cosecha" primero.</p>
            </div>`;
        } else {
            let html = `<p style="color:var(--cafe-500);margin-bottom:12px;">Selecciona un lote para cargar sus datos al beneficio:</p>
            <div class="table-container">
                <table>
                    <thead><tr><th>Lote</th><th>Días Corte</th><th>Latas</th><th>Kilos</th><th></th></tr></thead>
                    <tbody>`;
            this.cosechasDisponibles.forEach(c => {
                html += `<tr>
                    <td><strong>${Utils.escapar(c.lote_codigo)}</strong></td>
                    <td>${c.dias_corte}</td>
                    <td>${Utils.numero(c.total_latas, 0)}</td>
                    <td>${Utils.numero(c.total_kilos, 0)} kg</td>
                    <td><button class="btn btn-sm btn-primary" onclick="Beneficio.cargarDesdeCosecha(${c.lote_id}, ${c.total_kilos})">Cargar</button></td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            body.innerHTML = html;
        }

        Utils.mostrarModal('modal-cosecha-beneficio');
    },

    cargarDesdeCosecha(loteId, totalKilos) {
        // Llenar formulario de beneficio con datos de la cosecha
        Utils.setVal('beneficio-lote', loteId);
        Utils.setVal('beneficio-cereza', totalKilos);
        Utils.cerrarModal('modal-cosecha-beneficio');
        // Recalcular rendimiento si hay pergamino
        this.calcular();
        Utils.toast(`✅ Cargados ${Utils.numero(totalKilos, 0)} kg de cereza del lote seleccionado`);
    },

    calcular() {
        const cereza = parseFloat(Utils.getVal('beneficio-cereza')) || 0;
        const pergamino = parseFloat(Utils.getVal('beneficio-pergamino')) || 0;
        if (cereza > 0) {
            const rend = (pergamino / cereza) * 100;
            document.getElementById('beneficio-rendimiento').value = rend.toFixed(1) + '%';
        }
    },

    nuevo() {
        Utils.limpiarForm('modal-beneficio');
        Validador.limpiarForm('modal-beneficio');
        Utils.setVal('beneficio-fecha-ini', Utils.hoy());
        Utils.setVal('beneficio-fecha-fin', Utils.hoy());
        Utils.mostrarModal('modal-beneficio');
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'beneficio-lote': ['select'],
            'beneficio-cereza': ['required', 'positive'],
            'beneficio-pergamino': ['required', 'positive']
        };
        if (!Validador.validarForm(campos)) return;

        const cereza = parseFloat(Utils.getVal('beneficio-cereza')) || 0;
        const pergamino = parseFloat(Utils.getVal('beneficio-pergamino')) || 0;
        const loteId = Utils.getVal('beneficio-lote');

        const data = {
            lote_id: loteId,
            fecha_inicio: Utils.getVal('beneficio-fecha-ini') || Utils.hoy(),
            fecha_fin: Utils.getVal('beneficio-fecha-fin'),
            kilos_cereza_ingresados: cereza,
            kilos_pergamino_seco: pergamino,
            rendimiento_porcentaje: parseFloat(((pergamino / cereza) * 100).toFixed(1)),
            metodo: Utils.getVal('beneficio-metodo') || 'lavado',
            horas_fermentacion: Utils.getVal('beneficio-fermentacion'),
            tipo_secado: Utils.getVal('beneficio-secado') || 'sol',
            dias_secado: Utils.getVal('beneficio-dias'),
            humedad_final_porcentaje: Utils.getVal('beneficio-humedad'),
            observaciones: Utils.getVal('beneficio-observaciones')
        };

        try {
            await window.api.beneficio.create(data);
            Utils.toast('✅ Proceso registrado correctamente');
            // Mostrar tip contextual de educación
            Utils.mostrarTip('beneficio', 'guardar');
            Utils.cerrarModal('modal-beneficio');
            App.cargarPagina('beneficio');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Eliminar este proceso de beneficio?')) return;
        try {
            await window.api.beneficio.delete(id);
            Utils.toast('✅ Proceso eliminado');
            App.cargarPagina('beneficio');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    }
};

window.Beneficio = Beneficio;
