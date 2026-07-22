// ─── Cafetal OS — Ventas de café vinculadas al inventario ───
const VentasCafe = {
    ventas: [],
    disponibilidad: [],

    async cargar(container) {
        try {
            const [ventas, resumen, disponibilidad] = await Promise.all([
                window.api.ventasCafe.getAll(),
                window.api.ventasCafe.getSummary(),
                window.api.ventasCafe.getAvailability()
            ]);
            this.ventas = ventas || [];
            this.disponibilidad = disponibilidad || [];
            container.innerHTML = `
                <div class="page-header compras-header">
                    <div><h2>💼 Ventas de café</h2><p class="page-subtitle">Registre la salida comercial, descuente inventario y conserve cliente, factura, lote y destino.</p></div>
                    <div class="page-actions"><button class="btn btn-success" onclick="VentasCafe.nuevaVenta()">+ Nueva venta</button></div>
                </div>
                <div class="page-body">
                    <div class="operation-callout sale-callout">
                        <div class="operation-callout-icon">📉</div>
                        <div><strong>Salida automática del inventario</strong><p>Cada venta confirmada crea un movimiento de tipo venta en el kardex. Cafetal OS impide vender más café del disponible para el producto y origen seleccionados.</p></div>
                    </div>
                    <div class="kpi-grid">
                        <div class="kpi-card kpi-green"><div class="kpi-value">${Utils.numero(resumen.total_ventas,0)}</div><div class="kpi-label">Ventas registradas</div></div>
                        <div class="kpi-card"><div class="kpi-value">${Utils.numero(resumen.quintales,1)} qq</div><div class="kpi-label">Volumen vendido</div></div>
                        <div class="kpi-card kpi-gold"><div class="kpi-value">${Utils.moneda(resumen.ingresos)}</div><div class="kpi-label">Ingresos confirmados</div></div>
                        <div class="kpi-card"><div class="kpi-value">${Utils.numero(resumen.anuladas,0)}</div><div class="kpi-label">Ventas anuladas</div></div>
                    </div>
                    <div class="card">
                        <div class="card-header responsive-card-header"><span>Historial comercial</span><div class="inline-filters"><select id="venta-filtro-producto" class="form-control" onchange="VentasCafe.filtrar()"><option value="">Todos los productos</option>${this.productOptions()}</select><select id="venta-filtro-estado" class="form-control" onchange="VentasCafe.filtrar()"><option value="">Todos los estados</option><option value="confirmada">Confirmadas</option><option value="anulada">Anuladas</option></select></div></div>
                        <div class="card-body"><div class="table-container"><table><thead><tr><th>Código</th><th>Fecha</th><th>Cliente / destino</th><th>Producto</th><th>Origen</th><th>Cantidad</th><th>Precio/qq</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead><tbody id="ventas-tbody">${this.renderRows(this.ventas)}</tbody></table></div></div>
                    </div>
                </div>
                ${this.saleModal()}
            `;
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="page-body"><div class="module-error"><strong>No se pudo cargar Ventas de café</strong><p>${Utils.escapar(error.message)}</p></div></div>`;
        }
    },

    productOptions() {
        return [['cereza','Café cereza'],['pergamino_humedo','Pergamino húmedo'],['pergamino_seco','Pergamino seco'],['verde','Café verde / oro'],['tostado','Café tostado']]
            .map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
    },

    productLabel(value) {
        return { cereza:'Cereza', pergamino_humedo:'Pergamino húmedo', pergamino_seco:'Pergamino seco', verde:'Verde / oro', tostado:'Tostado' }[value] || value;
    },

    renderRows(rows) {
        if (!rows.length) return '<tr><td colspan="10" class="empty-state-cell">No hay ventas registradas. Cree una venta para descontar existencias y alimentar la rentabilidad.</td></tr>';
        return rows.map(item => `<tr class="${item.estado === 'anulada' ? 'row-muted' : ''}">
            <td><strong>${Utils.escapar(item.codigo)}</strong><small class="table-secondary">${Utils.escapar(item.factura || 'Sin factura')}</small></td>
            <td>${Utils.formatearFecha(item.fecha)}</td>
            <td><strong>${Utils.escapar(item.cliente)}</strong><small class="table-secondary">${Utils.escapar(item.destino || item.condicion_entrega || '')}</small></td>
            <td>${this.productLabel(item.tipo_producto)}</td>
            <td>${Utils.escapar(item.lote_codigo || 'Stock general / acopio')}</td>
            <td>${Utils.numero(item.cantidad_kg,1)} kg<small class="table-secondary">${Utils.numero(item.cantidad_qq,2)} qq</small></td>
            <td>${Utils.moneda(item.precio_por_qq)}</td>
            <td><strong>${Utils.moneda(item.total_venta)}</strong></td>
            <td><span class="status-pill ${item.estado === 'confirmada' ? 'aprobado' : 'rechazado'}">${item.estado}</span></td>
            <td>${item.estado === 'confirmada' ? `<button class="btn-icon" title="Anular y devolver inventario" onclick="VentasCafe.anular(${item.id})">↩</button>` : '—'}</td>
        </tr>`).join('');
    },

    saleModal() {
        return `<div id="modal-venta-cafe" class="modal-overlay"><div class="modal-content modal-wide"><div class="modal-header"><div><h3>💼 Nueva venta de café</h3><p>La venta se registrará únicamente si existe inventario suficiente.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-venta-cafe')">×</button></div><div class="modal-body">
            <div class="smart-form-banner"><strong>Control de inventario</strong><span>Seleccione el producto y el origen. El saldo disponible se calcula antes de guardar y el kardex se actualiza en una sola transacción.</span></div>
            <div class="form-row-3"><div class="form-group"><label>Código *</label><input id="venta-codigo" class="form-control" required /></div><div class="form-group"><label>Fecha *</label><input id="venta-fecha" type="date" class="form-control" required /></div><div class="form-group"><label>Factura / comprobante</label><input id="venta-factura" class="form-control" /></div></div>
            <div class="form-row-3"><div class="form-group"><label>Cliente / comprador *</label><input id="venta-cliente" class="form-control" required placeholder="Nombre comercial o persona" /></div><div class="form-group"><label>RTN / identificación</label><input id="venta-identificacion" class="form-control" /></div><div class="form-group"><label>Destino</label><input id="venta-destino" class="form-control" placeholder="Ciudad, beneficio, exportadora…" /></div></div>
            <div class="form-row-3"><div class="form-group"><label>Estado del café *</label><select id="venta-producto" class="form-control" onchange="VentasCafe.actualizarOrigenes()">${this.productOptions()}</select></div><div class="form-group"><label>Origen del inventario *</label><select id="venta-origen" class="form-control" onchange="VentasCafe.actualizarCalculos()"></select></div><div class="form-group"><label>Condición de entrega</label><select id="venta-condicion" class="form-control"><option value="Retiro en bodega">Retiro en bodega</option><option value="Entregado en destino">Entregado en destino</option><option value="Puesto en beneficio">Puesto en beneficio</option><option value="Exportación">Exportación</option></select></div></div>
            <div class="form-row-4"><div class="form-group"><label>Cantidad kg *</label><input id="venta-kg" type="number" min="0" step="0.01" class="form-control" oninput="VentasCafe.actualizarCalculos('kg')" /></div><div class="form-group"><label>Cantidad qq</label><input id="venta-qq" type="number" min="0" step="0.0001" class="form-control" oninput="VentasCafe.actualizarCalculos('qq')" /></div><div class="form-group"><label>Precio por kg</label><input id="venta-precio-kg" type="number" min="0" step="0.01" class="form-control" oninput="VentasCafe.actualizarCalculos('precioKg')" /></div><div class="form-group"><label>Precio por qq *</label><input id="venta-precio-qq" type="number" min="0" step="0.01" class="form-control" oninput="VentasCafe.actualizarCalculos('precioQq')" /></div></div>
            <div id="venta-calculo" class="calculation-strip"></div>
            <div class="form-group"><label>Observaciones</label><textarea id="venta-observaciones" class="form-control" rows="3"></textarea></div>
        </div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-venta-cafe')">Cancelar</button><button class="btn btn-primary" onclick="VentasCafe.guardar()">Confirmar venta y descontar inventario</button></div></div></div>`;
    },

    async nuevaVenta() {
        this.disponibilidad = await window.api.ventasCafe.getAvailability();
        if (!this.disponibilidad.length) { Utils.toast('No hay inventario disponible para vender.', 'error'); return; }
        Utils.limpiarForm('modal-venta-cafe');
        Utils.setVal('venta-fecha', Utils.hoy());
        Utils.setVal('venta-codigo', await window.api.ventasCafe.nextCode());
        const firstProduct = this.disponibilidad[0].tipo_producto;
        Utils.setVal('venta-producto', firstProduct);
        this.actualizarOrigenes();
        Utils.mostrarModal('modal-venta-cafe');
    },

    actualizarOrigenes() {
        const product = Utils.getVal('venta-producto');
        const options = this.disponibilidad.filter(item => item.tipo_producto === product && Number(item.disponible_qq) > 0);
        const select = document.getElementById('venta-origen');
        if (!select) return;
        select.innerHTML = options.map(item => `<option value="${item.lote_id || 'general'}" data-stock="${item.disponible_qq}">${Utils.escapar(item.lote_codigo)} · ${Utils.numero(item.disponible_qq,2)} qq</option>`).join('');
        this.actualizarCalculos();
    },

    actualizarCalculos(source) {
        let kg = Number(Utils.getVal('venta-kg') || 0), qq = Number(Utils.getVal('venta-qq') || 0), priceKg = Number(Utils.getVal('venta-precio-kg') || 0), priceQq = Number(Utils.getVal('venta-precio-qq') || 0);
        if (source === 'kg' && kg > 0) { qq = kg / 46; Utils.setVal('venta-qq', qq.toFixed(4)); }
        if (source === 'qq' && qq > 0) { kg = qq * 46; Utils.setVal('venta-kg', kg.toFixed(2)); }
        if (source === 'precioKg' && priceKg > 0) { priceQq = priceKg * 46; Utils.setVal('venta-precio-qq', priceQq.toFixed(2)); }
        if (source === 'precioQq' && priceQq > 0) { priceKg = priceQq / 46; Utils.setVal('venta-precio-kg', priceKg.toFixed(4)); }
        const origin = document.getElementById('venta-origen');
        const stock = Number(origin?.selectedOptions?.[0]?.dataset?.stock || 0);
        const total = qq * priceQq;
        const remaining = stock - qq;
        const warning = qq > stock ? '<span class="calculation-warning danger">Inventario insuficiente para confirmar la venta.</span>' : remaining >= 0 ? `<span>Saldo proyectado: ${Utils.numero(remaining,2)} qq</span>` : '';
        const host = document.getElementById('venta-calculo');
        if (host) host.innerHTML = `<div><small>Disponible</small><strong>${Utils.numero(stock,2)} qq</strong></div><div><small>Total de venta</small><strong>${Utils.moneda(total)}</strong></div><div><small>Resultado</small><strong>${warning || 'Ingrese cantidad y precio'}</strong></div>`;
    },

    async guardar() {
        const origin = Utils.getVal('venta-origen');
        const data = {
            codigo: Utils.getVal('venta-codigo'), fecha: Utils.getVal('venta-fecha'), cliente: Utils.getVal('venta-cliente'),
            identificacion_cliente: Utils.getVal('venta-identificacion'), factura: Utils.getVal('venta-factura'), destino: Utils.getVal('venta-destino'),
            condicion_entrega: Utils.getVal('venta-condicion'), tipo_producto: Utils.getVal('venta-producto'), lote_id: origin === 'general' ? null : origin,
            cantidad_kg: Utils.getVal('venta-kg'), cantidad_qq: Utils.getVal('venta-qq'), precio_por_kg: Utils.getVal('venta-precio-kg'),
            precio_por_qq: Utils.getVal('venta-precio-qq'), observaciones: Utils.getVal('venta-observaciones')
        };
        try {
            const result = await window.api.ventasCafe.create(data);
            Utils.toast(`Venta registrada por ${Utils.moneda(result.total_venta)}. Saldo: ${Utils.numero(result.disponible_restante_qq,2)} qq.`);
            Utils.cerrarModal('modal-venta-cafe');
            App.cargarPagina('ventas');
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    async anular(id) {
        if (!await Utils.confirmar('¿Desea anular esta venta? El movimiento será retirado del kardex y el inventario se restituirá.')) return;
        try { await window.api.ventasCafe.cancel(id); Utils.toast('Venta anulada e inventario restituido.'); App.cargarPagina('ventas'); }
        catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    async filtrar() {
        this.ventas = await window.api.ventasCafe.getAll({ tipo_producto: Utils.getVal('venta-filtro-producto'), estado: Utils.getVal('venta-filtro-estado') });
        document.getElementById('ventas-tbody').innerHTML = this.renderRows(this.ventas);
    }
};
window.VentasCafe = VentasCafe;
