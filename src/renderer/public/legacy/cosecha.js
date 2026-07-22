// ─── Módulo: Cosecha / Recolección ───

const Cosecha = {
    fechaActual: Utils.hoy(),

    async cargar(container) {
        try {
            const appInfo = await window.api.app.getInfo();
            if (appInfo?.mode === 'demo' && this.fechaActual === Utils.hoy()) {
                const latestDate = await window.api.cosecha.getLatestDate();
                if (latestDate) this.fechaActual = latestDate;
            }
            const lotes = await window.api.lotes.getAll();
            const recolectores = await window.api.recolectores.getAll();
            const cortesHoy = await window.api.cosecha.getByDate(this.fechaActual);
            const resumen = await window.api.cosecha.getResumen(this.fechaActual, this.fechaActual);
            
            container.innerHTML = `
                <div class="page-header">
                    <h2>📅 Cosecha / Recolección</h2>
                    <button class="btn btn-success" onclick="Cosecha.nuevo()">+ Nuevo Corte</button>
                </div>
                <div class="page-body">
                    <div class="filters-bar">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="cosecha-fecha" class="form-control" 
                                value="${this.fechaActual}" onchange="Cosecha.cambiarFecha(this.value)">
                        </div>
                    </div>

                    <div class="resumen-bar">
                        <div class="resumen-item">
                            <div class="value">${Utils.numero(resumen.total_cortes, 0)}</div>
                            <div class="label">Cortes</div>
                        </div>
                        <div class="resumen-item">
                            <div class="value">${Utils.numero(resumen.total_latas, 0)}</div>
                            <div class="label">Latas</div>
                        </div>
                        <div class="resumen-item">
                            <div class="value">${Utils.numero(resumen.total_kilos, 0)} kg</div>
                            <div class="label">Kilos</div>
                        </div>
                        <div class="resumen-item">
                            <div class="value">${Utils.moneda(resumen.total_pagado)}</div>
                            <div class="label">Pagado</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">📋 Cortes del Día</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Lote</th>
                                            <th>Recolector</th>
                                            <th>Latas</th>
                                            <th>Kilos</th>
                                            <th>Madurez</th>
                                            <th>Precio/Lata</th>
                                            <th>Total</th>
                                            <th>Hora</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${cortesHoy.length === 0 ?
                                            '<tr><td colspan="9" class="text-center" style="padding:30px;color:var(--cafe-400);">No hay cortes registrados para la fecha seleccionada.</td></tr>' :
                                            cortesHoy.map(c => `
                                                <tr>
                                                    <td>${Utils.escapar(c.lote_codigo)}</td>
                                                    <td>${Utils.escapar(c.recolector_nombre || 'Sin asignar')}</td>
                                                    <td><strong>${Utils.numero(c.latas_recolectadas, 0)}</strong></td>
                                                    <td>${Utils.numero(c.kilos_estimados, 0)}</td>
                                                    <td>${c.tipo_madurez || '-'}</td>
                                                    <td>${c.precio_por_lata ? Utils.moneda(c.precio_por_lata) : '-'}</td>
                                                    <td>${Utils.moneda(c.total_pagado)}</td>
                                                    <td>${c.hora_inicio ? c.hora_inicio.substring(0,5) : '-'}</td>
                                                    <td><button class="btn-icon" onclick="Cosecha.eliminar(${c.id})" title="Eliminar">🗑️</button></td>
                                                </tr>
                                            `).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo Corte -->
                <div id="modal-corte" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📅 Nuevo Corte</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-corte')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Lote *</label>
                                    <select id="corte-lote" class="form-control" required></select>
                                </div>
                                <div class="form-group">
                                    <label>Recolector</label>
                                    <select id="corte-recolector" class="form-control"></select>
                                </div>
                                <div class="form-group">
                                    <label style="opacity:0;">&nbsp;</label>
                                    <button class="btn btn-outline btn-sm" onclick="Cosecha.nuevoRecolector()" style="width:100%;">+ Nuevo</button>
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Latas Recolectadas *</label>
                                    <input type="number" id="corte-latas" class="form-control" step="0.5"
                                        placeholder="Ej: 12" oninput="Cosecha.calcular()" required>
                                </div>
                                <div class="form-group">
                                    <label>Kilos Estimados</label>
                                    <input type="number" id="corte-kilos" class="form-control" step="0.1" readonly
                                        style="background:var(--cafe-50);">
                                </div>
                                <div class="form-group">
                                    <label>Peso por Lata (kg)</label>
                                    <input type="number" id="corte-peso-lata" class="form-control" step="0.1" value="18"
                                        oninput="Cosecha.calcular()">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Tipo de Madurez</label>
                                    <select id="corte-madurez" class="form-control">
                                        <option value="maduro">Maduro</option>
                                        <option value="verde">Verde</option>
                                        <option value="pinton">Pintón</option>
                                        <option value="sobremaduro">Sobremaduro</option>
                                        <option value="mixto">Mixto</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Precio por Lata (L)</label>
                                    <input type="number" id="corte-precio" class="form-control" step="0.5"
                                        placeholder="Ej: 35" oninput="Cosecha.calcular()">
                                </div>
                                <div class="form-group">
                                    <label>Total a Pagar</label>
                                    <input type="text" id="corte-total" class="form-control" readonly
                                        style="font-weight:700;color:var(--cafe-800);background:var(--cafe-50);">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Hora Inicio</label>
                                    <input type="time" id="corte-hora-ini" class="form-control" value="07:00">
                                </div>
                                <div class="form-group">
                                    <label>Hora Fin</label>
                                    <input type="time" id="corte-hora-fin" class="form-control" value="15:00">
                                </div>
                                <div class="form-group">
                                    <label>Fecha</label>
                                    <input type="date" id="corte-fecha" class="form-control" value="${this.fechaActual}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Observaciones</label>
                                <textarea id="corte-observaciones" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-corte')">Cancelar</button>
                            <button class="btn btn-success" onclick="Cosecha.guardar()">💾 Registrar Corte</button>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo Recolector -->
                <div id="modal-recolector" class="modal-overlay">
                    <div class="modal-content" style="max-width:400px;">
                        <div class="modal-header">
                            <h3>👤 Nuevo Recolector</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-recolector')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" id="recolector-nombre" class="form-control" placeholder="Nombres y apellidos">
                            </div>
                            <div class="form-row-2" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                                <div class="form-group">
                                    <label>Identificación</label>
                                    <input type="text" id="recolector-id" class="form-control" placeholder="DNI">
                                </div>
                                <div class="form-group">
                                    <label>Teléfono</label>
                                    <input type="text" id="recolector-tel" class="form-control" placeholder="9990-0000">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-recolector')">Cancelar</button>
                            <button class="btn btn-primary" onclick="Cosecha.guardarRecolector()">💾 Guardar</button>
                        </div>
                    </div>
                </div>
            `;

            // Cargar selects
            const lotesActivos = lotes.filter(l => l.estado === 'produccion' || l.estado === 'nuevo');
            await Utils.cargarSelect('corte-lote', lotesActivos, 'id', 'codigo', 'Seleccionar lote...');
            await Utils.cargarSelect('corte-recolector', recolectores, 'id', 'nombre_completo', 'Sin asignar...');

        } catch (err) {
            console.error('Error cargando cosecha:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar cosecha.</p></div>`;
        }
    },

    cambiarFecha(fecha) {
        this.fechaActual = fecha;
        App.cargarPagina('cosecha');
    },

    calcular() {
        const latas = parseFloat(Utils.getVal('corte-latas')) || 0;
        const peso = parseFloat(Utils.getVal('corte-peso-lata')) || 18;
        const precio = parseFloat(Utils.getVal('corte-precio')) || 0;
        
        document.getElementById('corte-kilos').value = (latas * peso).toFixed(1);
        document.getElementById('corte-total').value = Utils.moneda(latas * precio);
    },

    nuevo() {
        Utils.limpiarForm('modal-corte');
        Validador.limpiarForm('modal-corte');
        Utils.setVal('corte-peso-lata', 18);
        Utils.setVal('corte-fecha', this.fechaActual);
        Utils.setVal('corte-hora-ini', '07:00');
        Utils.setVal('corte-hora-fin', '15:00');
        Utils.mostrarModal('modal-corte');
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'corte-lote': ['select'],
            'corte-latas': ['required', 'positive']
        };
        if (!Validador.validarForm(campos)) return;

        const latas = parseFloat(Utils.getVal('corte-latas')) || 0;
        const peso = parseFloat(Utils.getVal('corte-peso-lata')) || 18;
        const precio = parseFloat(Utils.getVal('corte-precio')) || 0;
        const loteId = Utils.getVal('corte-lote');

        const data = {
            lote_id: loteId,
            fecha: Utils.getVal('corte-fecha') || this.fechaActual,
            recolector_id: Utils.getVal('corte-recolector') || null,
            latas_recolectadas: latas,
            kilos_estimados: latas * peso,
            peso_lata_kg: peso,
            tipo_madurez: Utils.getVal('corte-madurez') || 'maduro',
            precio_por_lata: precio || null,
            total_pagado: latas * precio,
            hora_inicio: Utils.getVal('corte-hora-ini'),
            hora_fin: Utils.getVal('corte-hora-fin'),
            observaciones: Utils.getVal('corte-observaciones')
        };

        try {
            await window.api.cosecha.create(data);
            Utils.toast('✅ Corte registrado correctamente');
            Utils.mostrarTip('cosecha', 'guardar');
            Utils.cerrarModal('modal-corte');
            App.cargarPagina('cosecha');
        } catch (err) {
            Utils.toast('❌ Error al guardar: ' + err.message, 'error');
        }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Eliminar este registro de corte?')) return;
        try {
            await window.api.cosecha.delete(id);
            Utils.toast('✅ Corte eliminado');
            App.cargarPagina('cosecha');
        } catch (err) {
            Utils.toast('❌ Error al eliminar: ' + err.message, 'error');
        }
    },

    nuevoRecolector() {
        Utils.limpiarForm('modal-recolector');
        Utils.mostrarModal('modal-recolector');
    },

    async guardarRecolector() {
        // Validar campos del formulario
        const campos = {
            'recolector-nombre': ['required']
        };
        if (!Validador.validarForm(campos)) return;

        const nombre = Utils.getVal('recolector-nombre');
        try {
            await window.api.recolectores.create({
                nombre_completo: nombre,
                identificacion: Utils.getVal('recolector-id'),
                telefono: Utils.getVal('recolector-tel')
            });
            Utils.toast('✅ Recolector guardado');
            Utils.cerrarModal('modal-recolector');
            // Recargar select de recolectores
            const recolectores = await window.api.recolectores.getAll();
            await Utils.cargarSelect('corte-recolector', recolectores, 'id', 'nombre_completo', 'Sin asignar...');
            Utils.setVal('corte-recolector', recolectores[recolectores.length - 1].id);
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    }
};

window.Cosecha = Cosecha;
