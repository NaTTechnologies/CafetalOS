// ─── Módulo: Inventario ───

const Inventario = {
    async cargar(container) {
        try {
            const resumen = await window.api.inventario.getResumen();
            const movimientos = await window.api.inventario.getMovimientos();
            const lotes = await window.api.lotes.getAll();

            // Mapa de productos
            const prodLabels = {
                'cereza': 'Cereza',
                'pergamino_humedo': 'Pergamino Húmedo',
                'pergamino_seco': 'Pergamino Seco',
                'verde': 'Verde / Trillado',
                'tostado': 'Tostado'
            };
            const prodIcons = {
                'cereza': '🍒', 'pergamino_humedo': '💧', 'pergamino_seco': '🟤', 'verde': '🟢', 'tostado': '☕'
            };

            container.innerHTML = `
                <div class="page-header">
                    <h2>📦 Inventario / Almacén</h2>
                    <button class="btn btn-success" onclick="Inventario.nuevo()">+ Movimiento</button>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        ${resumen.length === 0 ? 
                            '<div class="kpi-card"><div class="kpi-value">0</div><div class="kpi-label">Sin existencias</div></div>' :
                            resumen.map(r => `
                                <div class="kpi-card ${r.existencias_qq > 0 ? 'kpi-green' : ''}">
                                    <div class="kpi-icon">${prodIcons[r.tipo_producto] || '📦'}</div>
                                    <div class="kpi-value">${Utils.numero(r.existencias_qq, 1)} qq</div>
                                    <div class="kpi-label">${prodLabels[r.tipo_producto] || r.tipo_producto}</div>
                                </div>
                            `).join('')
                        }
                    </div>

                    <div class="card">
                        <div class="card-header">📋 Movimientos Recientes</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Producto</th>
                                            <th>Cantidad (qq)</th>
                                            <th>Cantidad (kg)</th>
                                            <th>Lote</th>
                                            <th>Cliente/Destino</th>
                                            <th>Precio/qq</th>
                                            <th>Total</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${movimientos.length === 0 ?
                                            '<tr><td colspan="10" class="text-center" style="padding:30px;color:var(--cafe-400);">No hay movimientos registrados.</td></tr>' :
                                            movimientos.map(m => `
                                                <tr>
                                                    <td>${Utils.formatearFecha(m.fecha_movimiento)}</td>
                                                    <td><span class="badge ${m.tipo_movimiento === 'entrada' ? 'badge-produccion' : 'badge-descanso'}">${m.tipo_movimiento}</span></td>
                                                    <td>${prodLabels[m.tipo_producto] || m.tipo_producto}</td>
                                                    <td><strong>${Utils.numero(m.cantidad_qq, 1)}</strong></td>
                                                    <td>${Utils.numero(m.cantidad_kg, 0)}</td>
                                                    <td>${m.lote_codigo ? Utils.escapar(m.lote_codigo) : '-'}</td>
                                                    <td>${Utils.escapar(m.cliente_destino || '-')}</td>
                                                    <td>${m.precio_venta_qq ? Utils.moneda(m.precio_venta_qq) : '-'}</td>
                                                    <td>${m.total_venta ? Utils.moneda(m.total_venta) : '-'}</td>
                                                    <td><button class="btn-icon" onclick="Inventario.eliminar(${m.id})" title="Eliminar">🗑️</button></td>
                                                </tr>
                                            `).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo Movimiento -->
                <div id="modal-inventario" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📦 Nuevo Movimiento de Inventario</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-inventario')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Producto *</label>
                                    <select id="inv-producto" class="form-control">
                                        <option value="cereza">🍒 Cereza</option>
                                        <option value="pergamino_humedo">💧 Pergamino Húmedo</option>
                                        <option value="pergamino_seco">🟤 Pergamino Seco</option>
                                        <option value="verde">🟢 Verde / Trillado</option>
                                        <option value="tostado">☕ Tostado</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Movimiento *</label>
                                    <select id="inv-tipo" class="form-control" onchange="Inventario.cambioTipo()">
                                        <option value="entrada">📥 Entrada</option>
                                        <option value="salida">📤 Salida</option>
                                        <option value="venta">💰 Venta</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Fecha</label>
                                    <input type="date" id="inv-fecha" class="form-control" value="${Utils.hoy()}">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Cantidad (Quintales) *</label>
                                    <input type="number" id="inv-cantidad" class="form-control" step="0.1"
                                        placeholder="Ej: 20" oninput="Inventario.calcular()">
                                </div>
                                <div class="form-group">
                                    <label>Kilos (calculado)</label>
                                    <input type="text" id="inv-kilos" class="form-control" readonly
                                        style="background:var(--cafe-50);">
                                </div>
                                <div class="form-group">
                                    <label>Lote de Procedencia</label>
                                    <select id="inv-lote" class="form-control"><option value="">Sin lote específico</option></select>
                                </div>
                            </div>
                            <div id="inv-venta-fields">
                                <div class="form-row-3">
                                    <div class="form-group">
                                        <label>Precio de Venta (L/qq)</label>
                                        <input type="number" id="inv-precio" class="form-control" step="0.5"
                                            oninput="Inventario.calcular()">
                                    </div>
                                    <div class="form-group">
                                        <label>Total Venta</label>
                                        <input type="text" id="inv-total" class="form-control" readonly
                                            style="font-weight:700;color:var(--cafe-800);background:var(--cafe-50);">
                                    </div>
                                    <div class="form-group">
                                        <label>Cliente / Destino</label>
                                        <input type="text" id="inv-cliente" class="form-control" placeholder="Nombre del comprador">
                                    </div>
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Ubicación</label>
                                    <input type="text" id="inv-ubicacion" class="form-control" placeholder="Bodega, número de saco">
                                </div>
                                <div class="form-group">
                                    <label>Factura / Comprobante</label>
                                    <input type="text" id="inv-factura" class="form-control" placeholder="N° factura">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Observaciones</label>
                                <textarea id="inv-observaciones" class="form-control" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-inventario')">Cancelar</button>
                            <button class="btn btn-primary" onclick="Inventario.guardar()">💾 Registrar Movimiento</button>
                        </div>
                    </div>
                </div>
            `;

            // Cargar lotes en select
            const selectLote = document.getElementById('inv-lote');
            lotes.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id;
                opt.textContent = l.codigo;
                selectLote.appendChild(opt);
            });

            // Mostrar/ocultar campos de venta
            this.cambioTipo();

        } catch (err) {
            console.error('Error cargando inventario:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar inventario.</p></div>`;
        }
    },

    cambioTipo() {
        const tipo = Utils.getVal('inv-tipo');
        const ventaFields = document.getElementById('inv-venta-fields');
        if (tipo === 'venta') {
            ventaFields.style.display = 'block';
        } else {
            ventaFields.style.display = 'none';
        }
    },

    calcular() {
        const qq = parseFloat(Utils.getVal('inv-cantidad')) || 0;
        const precio = parseFloat(Utils.getVal('inv-precio')) || 0;
        document.getElementById('inv-kilos').value = (qq * 46).toFixed(0) + ' kg';
        document.getElementById('inv-total').value = Utils.moneda(qq * precio);
    },

    nuevo() {
        Utils.limpiarForm('modal-inventario');
        Validador.limpiarForm('modal-inventario');
        Utils.setVal('inv-fecha', Utils.hoy());
        this.cambioTipo();
        Utils.mostrarModal('modal-inventario');
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'inv-cantidad': ['required', 'positive'],
            'inv-producto': ['select'],
            'inv-tipo': ['select']
        };
        if (!Validador.validarForm(campos)) return;

        const cantidad = parseFloat(Utils.getVal('inv-cantidad')) || 0;

        const precio = parseFloat(Utils.getVal('inv-precio')) || null;
        const tipo = Utils.getVal('inv-tipo') || 'entrada';

        const data = {
            tipo_producto: Utils.getVal('inv-producto') || 'pergamino_seco',
            tipo_movimiento: tipo,
            cantidad_qq: cantidad,
            fecha_movimiento: Utils.getVal('inv-fecha') || Utils.hoy(),
            lote_id: Utils.getVal('inv-lote') || null,
            beneficio_id: null,
            ubicacion: Utils.getVal('inv-ubicacion'),
            cliente_destino: tipo === 'venta' ? Utils.getVal('inv-cliente') : null,
            precio_venta_qq: precio,
            factura: Utils.getVal('inv-factura'),
            observaciones: Utils.getVal('inv-observaciones')
        };

        try {
            await window.api.inventario.create(data);
            Utils.toast('✅ Movimiento registrado correctamente');
            Utils.cerrarModal('modal-inventario');
            App.cargarPagina('inventario');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Eliminar este movimiento de inventario?')) return;
        try {
            await window.api.inventario.delete(id);
            Utils.toast('✅ Movimiento eliminado');
            App.cargarPagina('inventario');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    }
};

window.Inventario = Inventario;
