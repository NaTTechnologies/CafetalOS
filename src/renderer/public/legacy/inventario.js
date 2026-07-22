// ─── Cafetal OS — Inventario, kardex y alertas de permanencia ───
const Inventario = {
    lotes: [],
    prodLabels: {
        cereza: 'Cereza', pergamino_humedo: 'Pergamino húmedo', pergamino_seco: 'Pergamino seco',
        verde: 'Verde / trillado', tostado: 'Tostado'
    },
    prodIcons: { cereza: '🍒', pergamino_humedo: '💧', pergamino_seco: '🟤', verde: '🟢', tostado: '☕' },

    async cargar(container) {
        try {
            const [resumen, kardex, aging, lotes] = await Promise.all([
                window.api.inventario.getResumen(),
                window.api.inventario.getKardex({}),
                window.api.inventario.getAgingAlerts(),
                window.api.lotes.getAll()
            ]);
            this.lotes = lotes || [];
            container.innerHTML = `
                <div class="page-header compras-header">
                    <div><h2>📦 Inventario, kardex y rotación</h2><p class="page-subtitle">Controle entradas, salidas, ventas, saldo por origen y tiempo de permanencia del café.</p></div>
                    <div class="page-actions"><button class="btn btn-outline" onclick="App.cargarPagina('ventas')">💼 Ventas de café</button><button class="btn btn-success" onclick="Inventario.nuevo()">+ Movimiento</button></div>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        ${resumen.length === 0 ? '<div class="kpi-card"><div class="kpi-value">0</div><div class="kpi-label">Sin existencias</div></div>' : resumen.map(row => `
                            <div class="kpi-card ${Number(row.existencias_qq) > 0 ? 'kpi-green' : ''}">
                                <div class="kpi-icon">${this.prodIcons[row.tipo_producto] || '📦'}</div>
                                <div class="kpi-value">${Utils.numero(row.existencias_qq,1)} qq</div>
                                <div class="kpi-label">${this.prodLabels[row.tipo_producto] || row.tipo_producto}</div>
                            </div>`).join('')}
                    </div>

                    ${this.renderAgingPanel(aging)}

                    <div class="card kardex-card">
                        <div class="card-header responsive-card-header"><div><h3>📒 Kardex de café</h3><p>Saldo cronológico por producto y origen. Las ventas se registran desde el módulo comercial.</p></div><div class="inline-filters">
                            <select id="kardex-producto" class="form-control" onchange="Inventario.filtrarKardex()"><option value="">Todos los productos</option>${this.productOptions()}</select>
                            <select id="kardex-lote" class="form-control" onchange="Inventario.filtrarKardex()"><option value="">Todos los orígenes</option><option value="general">Stock general / acopio</option>${this.lotes.filter(l => !Number(l.es_sistema || 0)).map(l => `<option value="${l.id}">${Utils.escapar(l.codigo)}</option>`).join('')}</select>
                        </div></div>
                        <div class="card-body"><div class="table-container"><table><thead><tr><th>Fecha</th><th>Documento</th><th>Producto</th><th>Origen</th><th>Movimiento</th><th>Entrada</th><th>Salida</th><th>Saldo</th><th>Cliente / ubicación</th><th>Acción</th></tr></thead><tbody id="kardex-tbody">${this.renderKardex(kardex)}</tbody></table></div></div>
                    </div>
                </div>
                ${this.movementModal()}
            `;
            this.fillLots();
        } catch (error) {
            console.error('Error cargando inventario:', error);
            container.innerHTML = `<div class="page-body"><div class="module-error"><strong>No se pudo cargar el inventario</strong><p>${Utils.escapar(error.message)}</p></div></div>`;
        }
    },

    productOptions() {
        return Object.entries(this.prodLabels).map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
    },

    renderAgingPanel(data) {
        const summary = data?.summary || {};
        const lots = data?.lots || [];
        const risky = lots.filter(item => item.estado !== 'estable').slice(0, 12);
        return `<section class="card inventory-aging-card">
            <div class="card-header responsive-card-header"><div><h3>⏳ Alertas de permanencia y condición</h3><p>Priorice inspección, secado, transformación o venta antes de que el tiempo y la humedad comprometan la calidad.</p></div><div class="aging-summary"><span class="aging-critical">${Utils.numero(summary.criticos || 0,0)} críticas</span><span class="aging-warning">${Utils.numero(summary.advertencias || 0,0)} advertencias</span><span>${Utils.numero(summary.stock_qq || 0,1)} qq evaluados</span></div></div>
            <div class="card-body">
                ${risky.length ? `<div class="aging-grid">${risky.map(item => `<article class="aging-item ${item.estado}"><div class="aging-product">${this.prodIcons[item.tipo_producto] || '📦'} <strong>${Utils.escapar(item.producto_label)}</strong><span>${Utils.escapar(item.lote_codigo)}</span></div><div class="aging-values"><strong>${Utils.numero(item.restante_qq,2)} qq</strong><span>${Utils.numero(item.antiguedad_dias,0)} días en inventario</span></div><p>${Utils.escapar(item.razones?.join(' · ') || 'Revisión preventiva recomendada.')}</p><small>Entrada ${Utils.formatearFecha(item.fecha_entrada)} · ${Utils.escapar(item.ubicacion)}</small></article>`).join('')}</div>` : '<div class="inventory-ok-state">✅ No hay lotes de inventario fuera de los umbrales operativos de revisión.</div>'}
                <p class="inventory-research-note">${Utils.escapar(data?.note || '')} Para café seco y verde, Cafetal OS también marca humedad superior a 12.5% como condición crítica.</p>
            </div>
        </section>`;
    },

    renderKardex(rows) {
        if (!rows.length) return '<tr><td colspan="10" class="empty-state-cell">No hay movimientos para los filtros seleccionados.</td></tr>';
        return rows.map(row => {
            const isEntry = row.tipo_movimiento === 'entrada';
            const output = !isEntry;
            const documentRef = row.venta_codigo || row.factura || (row.compra_id ? `Compra #${row.compra_id}` : row.beneficio_id ? `Beneficio #${row.beneficio_id}` : `MOV-${row.id}`);
            return `<tr>
                <td>${Utils.formatearFecha(row.fecha_movimiento)}</td>
                <td><strong>${Utils.escapar(documentRef)}</strong></td>
                <td>${this.prodIcons[row.tipo_producto] || '📦'} ${this.prodLabels[row.tipo_producto] || row.tipo_producto}</td>
                <td>${Utils.escapar(row.lote_codigo || 'Stock general / acopio')}</td>
                <td><span class="kardex-movement ${row.tipo_movimiento}">${row.tipo_movimiento}</span></td>
                <td class="number-cell">${isEntry ? Utils.numero(row.cantidad_qq,2)+' qq' : '—'}</td>
                <td class="number-cell">${output ? Utils.numero(row.cantidad_qq,2)+' qq' : '—'}</td>
                <td class="number-cell"><strong>${Utils.numero(row.saldo_qq,2)} qq</strong></td>
                <td>${Utils.escapar(row.cliente_destino || row.ubicacion || '—')}</td>
                <td>${row.tipo_movimiento === 'venta' || row.compra_id || row.beneficio_id ? '<span title="Administre este movimiento desde su módulo de origen">🔒</span>' : `<button class="btn-icon" onclick="Inventario.eliminar(${row.id})" title="Eliminar movimiento">🗑</button>`}</td>
            </tr>`;
        }).join('');
    },

    movementModal() {
        return `<div id="modal-inventario" class="modal-overlay"><div class="modal-content"><div class="modal-header"><div><h3>📦 Movimiento interno</h3><p>Use esta opción para entradas, ajustes, consumos o mermas. Las ventas se registran en Ventas de café.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-inventario')">×</button></div><div class="modal-body">
            <div class="form-row-3"><div class="form-group"><label>Producto *</label><select id="inv-producto" class="form-control">${this.productOptions()}</select></div><div class="form-group"><label>Tipo *</label><select id="inv-tipo" class="form-control"><option value="entrada">Entrada</option><option value="salida">Salida / consumo / merma</option></select></div><div class="form-group"><label>Fecha *</label><input type="date" id="inv-fecha" class="form-control" /></div></div>
            <div class="form-row-3"><div class="form-group"><label>Cantidad (qq) *</label><input type="number" id="inv-cantidad" min="0" step="0.01" class="form-control" oninput="Inventario.calcular()" /></div><div class="form-group"><label>Kilos calculados</label><input id="inv-kilos" class="form-control" readonly /></div><div class="form-group"><label>Lote / origen</label><select id="inv-lote" class="form-control"><option value="">Stock general / acopio</option></select></div></div>
            <div class="form-row-2"><div class="form-group"><label>Ubicación</label><input id="inv-ubicacion" class="form-control" placeholder="Bodega, estiba, número de saco…" /></div><div class="form-group"><label>Factura / comprobante</label><input id="inv-factura" class="form-control" /></div></div>
            <div class="form-group"><label>Observaciones *</label><textarea id="inv-observaciones" class="form-control" rows="3" placeholder="Explique el origen de la entrada o motivo de la salida."></textarea></div>
        </div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-inventario')">Cancelar</button><button class="btn btn-primary" onclick="Inventario.guardar()">Registrar movimiento</button></div></div></div>`;
    },

    fillLots() {
        const select = document.getElementById('inv-lote');
        if (!select) return;
        this.lotes.filter(l => !Number(l.es_sistema || 0)).forEach(lote => {
            const option = document.createElement('option'); option.value = lote.id; option.textContent = lote.codigo; select.appendChild(option);
        });
    },

    async filtrarKardex() {
        try {
            const rows = await window.api.inventario.getKardex({ tipo_producto: Utils.getVal('kardex-producto'), lote_id: Utils.getVal('kardex-lote') });
            document.getElementById('kardex-tbody').innerHTML = this.renderKardex(rows);
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    calcular() {
        const qq = Number(Utils.getVal('inv-cantidad') || 0);
        const host = document.getElementById('inv-kilos');
        if (host) host.value = `${(qq * 46).toFixed(2)} kg`;
    },

    nuevo() {
        Utils.limpiarForm('modal-inventario');
        Validador.limpiarForm('modal-inventario');
        Utils.setVal('inv-fecha', Utils.hoy());
        Utils.setVal('inv-tipo', 'entrada');
        Utils.mostrarModal('modal-inventario');
    },

    async guardar() {
        const data = {
            tipo_producto: Utils.getVal('inv-producto'), tipo_movimiento: Utils.getVal('inv-tipo'), cantidad_qq: Utils.getVal('inv-cantidad'),
            fecha_movimiento: Utils.getVal('inv-fecha'), lote_id: Utils.getVal('inv-lote') || null, ubicacion: Utils.getVal('inv-ubicacion'),
            factura: Utils.getVal('inv-factura'), observaciones: Utils.getVal('inv-observaciones')
        };
        if (!data.observaciones) { Utils.toast('Explique el motivo del movimiento.', 'error'); return; }
        try { await window.api.inventario.create(data); Utils.toast('Movimiento registrado.'); Utils.cerrarModal('modal-inventario'); App.cargarPagina('inventario'); }
        catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Eliminar este movimiento interno de inventario?')) return;
        try { await window.api.inventario.delete(id); Utils.toast('Movimiento eliminado.'); App.cargarPagina('inventario'); }
        catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    }
};
window.Inventario = Inventario;
