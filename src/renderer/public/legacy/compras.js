// ─── Cafetal OS — Acopio y compras de café ───
const ComprasCafe = {
    compras: [],
    proveedores: [],

    async cargar(container) {
        try {
            const [compras, proveedores, resumen] = await Promise.all([
                window.api.comprasCafe.getAll(),
                window.api.proveedoresCafe.getAll(),
                window.api.comprasCafe.getSummary()
            ]);
            this.compras = compras;
            this.proveedores = proveedores;
            container.innerHTML = `
                <div class="page-header compras-header">
                    <div><h2>🧺 Compras y acopio de café</h2><p class="page-subtitle">Reciba café de terceros por peso, evalúe calidad, incorpórelo al inventario y conserve su origen.</p></div>
                    <div class="page-actions"><button class="btn btn-outline" onclick="ComprasCafe.nuevoProveedor()">+ Proveedor</button><button class="btn btn-success" onclick="ComprasCafe.nuevaCompra()">+ Nueva compra</button></div>
                </div>
                <div class="page-body">
                    <div class="operation-callout">
                        <div class="operation-callout-icon">⚖️</div>
                        <div><strong>Recepción comercial por peso</strong><p>Registre kilogramos o quintales. La humedad, los defectos, la variedad, el origen y el lote del proveedor permiten decidir si la compra se aprueba, condiciona o rechaza.</p></div>
                    </div>
                    <div class="kpi-grid">
                        <div class="kpi-card kpi-green"><div class="kpi-value">${Utils.numero(resumen.total_compras,0)}</div><div class="kpi-label">Recepciones</div></div>
                        <div class="kpi-card"><div class="kpi-value">${Utils.numero(resumen.kilos,1)} kg</div><div class="kpi-label">Café recibido</div></div>
                        <div class="kpi-card kpi-gold"><div class="kpi-value">${Utils.moneda(resumen.inversion)}</div><div class="kpi-label">Inversión acumulada</div></div>
                        <div class="kpi-card"><div class="kpi-value">${Utils.numero(resumen.pendientes,0)}</div><div class="kpi-label">Pendientes de calidad</div></div>
                    </div>
                    <div class="card">
                        <div class="card-header responsive-card-header"><span>Historial de compras</span><div class="inline-filters"><select id="compra-filtro-producto" class="form-control" onchange="ComprasCafe.filtrar()"><option value="">Todos los estados</option>${this.productOptions()}</select><select id="compra-filtro-calidad" class="form-control" onchange="ComprasCafe.filtrar()"><option value="">Toda calidad</option><option value="pendiente">Pendiente</option><option value="aprobado">Aprobado</option><option value="condicionado">Condicionado</option><option value="rechazado">Rechazado</option></select></div></div>
                        <div class="card-body"><div class="table-container"><table><thead><tr><th>Código</th><th>Fecha</th><th>Proveedor / origen</th><th>Producto</th><th>Peso</th><th>Humedad</th><th>Costo</th><th>Calidad</th><th>Acciones</th></tr></thead><tbody id="compras-tbody">${this.renderRows(compras)}</tbody></table></div></div>
                    </div>
                </div>
                ${this.purchaseModal()}
                ${this.providerModal()}
                ${this.qualityModal()}
                ${this.benefitModal()}
            `;
            await this.fillProviderSelect();
        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="page-body"><div class="module-error"><strong>No se pudo cargar Compras de café</strong><p>${Utils.escapar(error.message)}</p></div></div>`;
        }
    },

    productOptions() {
        return [
            ['cereza','Café cereza'],['pergamino_humedo','Pergamino húmedo'],['pergamino_seco','Pergamino seco'],['verde','Café verde / oro'],['tostado','Café tostado']
        ].map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
    },

    productLabel(value) {
        return { cereza:'Cereza', pergamino_humedo:'Pergamino húmedo', pergamino_seco:'Pergamino seco', verde:'Verde / oro', tostado:'Tostado' }[value] || value;
    },

    renderRows(rows) {
        if (!rows.length) return '<tr><td colspan="9" class="empty-state-cell">No hay compras registradas. Puede comenzar creando un proveedor y una recepción.</td></tr>';
        return rows.map(item => {
            const qualityClass = { aprobado:'success', condicionado:'warning', rechazado:'danger', pendiente:'neutral' }[item.estado_calidad] || 'neutral';
            const origin = [item.finca_origen, item.origen_geografico].filter(Boolean).join(' · ');
            return `<tr>
                <td><strong>${Utils.escapar(item.codigo)}</strong><small class="table-secondary">${Utils.escapar(item.temporada || '')}</small></td>
                <td>${Utils.formatearFecha(item.fecha)}</td>
                <td><strong>${Utils.escapar(item.proveedor_nombre)}</strong><small class="table-secondary">${Utils.escapar(origin || item.proveedor_tipo || '')}</small></td>
                <td>${this.productLabel(item.tipo_producto)}<small class="table-secondary">${Utils.escapar(item.variedad || item.lote_proveedor || '')}</small></td>
                <td>${Utils.numero(item.cantidad_kg,1)} kg<small class="table-secondary">${Utils.numero(item.cantidad_qq,2)} qq</small></td>
                <td>${item.humedad_porcentaje == null ? '—' : Utils.numero(item.humedad_porcentaje,1)+'%'}</td>
                <td>${Utils.moneda(item.costo_total)}</td>
                <td><span class="status-pill ${qualityClass}">${item.estado_calidad}</span></td>
                <td><div class="row-actions compact">
                    <button class="btn-icon" title="Revisar calidad y recepción" onclick="ComprasCafe.abrirCalidad(${item.id})">🔬</button>
                    ${item.estado_calidad === 'pendiente' ? `<button class="btn-icon" title="Aprobar recepción" onclick="ComprasCafe.cambiarEstado(${item.id},'aprobado')">✓</button><button class="btn-icon" title="Condicionar recepción" onclick="ComprasCafe.cambiarEstado(${item.id},'condicionado')">⚠</button><button class="btn-icon" title="Rechazar recepción" onclick="ComprasCafe.cambiarEstado(${item.id},'rechazado')">✕</button>` : ''}
                    ${['cereza','pergamino_humedo'].includes(item.tipo_producto) && item.inventario_id ? `<button class="btn-icon" title="Enviar a beneficio" onclick="ComprasCafe.abrirBeneficio(${item.id})">↻</button>` : ''}
                </div></td>
            </tr>`;
        }).join('');
    },

    purchaseModal() {
        return `<div id="modal-compra-cafe" class="modal-overlay"><div class="modal-content modal-wide"><div class="modal-header"><div><h3>🧺 Nueva compra de café</h3><p>Recepción por peso con trazabilidad y control de calidad.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-compra-cafe')">×</button></div><div class="modal-body">
            <div class="smart-form-banner"><strong>Decisión operativa</strong><span>Las compras aprobadas o condicionadas crean automáticamente una entrada de inventario. Las pendientes permanecen en recepción.</span></div>
            <div class="form-row-3"><div class="form-group"><label>Código *</label><input id="compra-codigo" class="form-control" required /></div><div class="form-group"><label>Fecha *</label><input id="compra-fecha" type="date" class="form-control" required /></div><div class="form-group"><label>Temporada</label><input id="compra-temporada" class="form-control" placeholder="2026-2027" /></div></div>
            <div class="form-row-3"><div class="form-group"><label>Proveedor *</label><select id="compra-proveedor" class="form-control" required></select></div><div class="form-group"><label>Estado del café *</label><select id="compra-producto" class="form-control" onchange="ComprasCafe.actualizarCalculos()">${this.productOptions()}</select></div><div class="form-group"><label>Estado de recepción</label><select id="compra-estado" class="form-control"><option value="pendiente">Pendiente de calidad</option><option value="aprobado">Aprobado</option><option value="condicionado">Condicionado</option><option value="rechazado">Rechazado</option></select></div></div>
            <div class="form-row-4"><div class="form-group"><label>Cantidad kg *</label><input id="compra-kg" type="number" min="0" step="0.01" class="form-control" oninput="ComprasCafe.actualizarCalculos('kg')" /></div><div class="form-group"><label>Cantidad qq</label><input id="compra-qq" type="number" min="0" step="0.0001" class="form-control" oninput="ComprasCafe.actualizarCalculos('qq')" /></div><div class="form-group"><label>Precio por kg</label><input id="compra-precio-kg" type="number" min="0" step="0.01" class="form-control" oninput="ComprasCafe.actualizarCalculos('precioKg')" /></div><div class="form-group"><label>Precio por qq</label><input id="compra-precio-qq" type="number" min="0" step="0.01" class="form-control" oninput="ComprasCafe.actualizarCalculos('precioQq')" /></div></div>
            <div id="compra-calculo" class="calculation-strip">Ingrese peso y precio para calcular el costo total.</div>
            <div class="form-row-4"><div class="form-group"><label>Humedad (%)</label><input id="compra-humedad" type="number" min="0" max="100" step="0.1" class="form-control" oninput="ComprasCafe.actualizarCalculos()" /></div><div class="form-group"><label>Defectos (%)</label><input id="compra-defectos" type="number" min="0" max="100" step="0.1" class="form-control" /></div><div class="form-group"><label>Variedad</label><input id="compra-variedad" class="form-control" /></div><div class="form-group"><label>Lote del proveedor</label><input id="compra-lote-proveedor" class="form-control" /></div></div>
            <div class="form-row-3"><div class="form-group"><label>Finca de origen</label><input id="compra-finca-origen" class="form-control" /></div><div class="form-group"><label>Origen geográfico</label><input id="compra-origen" class="form-control" placeholder="Municipio, departamento, país" /></div><div class="form-group"><label>Ubicación de recepción</label><input id="compra-ubicacion" class="form-control" placeholder="Bodega / beneficio" /></div></div>
            <div class="form-row-2"><div class="form-group"><label>Factura / comprobante</label><input id="compra-factura" class="form-control" /></div><div class="form-group"><label>Observaciones</label><textarea id="compra-observaciones" class="form-control" rows="2"></textarea></div></div>
        </div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-compra-cafe')">Cancelar</button><button class="btn btn-primary" onclick="ComprasCafe.guardarCompra()">💾 Guardar recepción</button></div></div></div>`;
    },

    providerModal() {
        return `<div id="modal-proveedor-cafe" class="modal-overlay"><div class="modal-content"><div class="modal-header"><h3>👤 Nuevo proveedor de café</h3><button class="modal-close" onclick="Utils.cerrarModal('modal-proveedor-cafe')">×</button></div><div class="modal-body"><div class="form-row-2"><div class="form-group"><label>Código</label><input id="proveedor-codigo" class="form-control" /></div><div class="form-group"><label>Tipo *</label><select id="proveedor-tipo" class="form-control"><option value="productor">Productor</option><option value="intermediario">Intermediario</option><option value="cooperativa">Cooperativa</option><option value="beneficio">Beneficio</option><option value="exportador">Exportador</option><option value="otro">Otro</option></select></div></div><div class="form-group"><label>Nombre *</label><input id="proveedor-nombre" class="form-control" required /></div><div class="form-row-2"><div class="form-group"><label>Identificación / RTN</label><input id="proveedor-id" class="form-control" /></div><div class="form-group"><label>Ubicación</label><input id="proveedor-ubicacion" class="form-control" /></div></div><div class="form-row-2"><div class="form-group"><label>Teléfono</label><input id="proveedor-telefono" class="form-control" /></div><div class="form-group"><label>Correo</label><input id="proveedor-email" type="email" class="form-control" /></div></div><div class="form-group"><label>Certificaciones</label><input id="proveedor-certificaciones" class="form-control" placeholder="Orgánico, 4C, Comercio Justo…" /></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-proveedor-cafe')">Cancelar</button><button class="btn btn-primary" onclick="ComprasCafe.guardarProveedor()">Guardar proveedor</button></div></div></div>`;
    },

    qualityModal() {
        return `<div id="modal-compra-calidad" class="modal-overlay"><div class="modal-content"><div class="modal-header"><div><h3>🔬 Revisión de calidad</h3><p id="compra-calidad-contexto">Complete la evaluación antes de aprobar el ingreso al inventario.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-compra-calidad')">×</button></div><div class="modal-body"><input id="compra-calidad-id" type="hidden"/><div class="smart-form-banner"><strong>Control de recepción</strong><span>Para café seco o verde, la humedad es obligatoria cuando se aprueba o condiciona. El porcentaje de defectos documenta la decisión.</span></div><div class="form-row-3"><div class="form-group"><label>Humedad (%)</label><input id="compra-calidad-humedad" type="number" min="0" max="100" step="0.1" class="form-control"/></div><div class="form-group"><label>Defectos (%)</label><input id="compra-calidad-defectos" type="number" min="0" max="100" step="0.1" class="form-control"/></div><div class="form-group"><label>Decisión</label><select id="compra-calidad-estado" class="form-control"><option value="pendiente">Pendiente</option><option value="aprobado">Aprobado</option><option value="condicionado">Condicionado</option><option value="rechazado">Rechazado</option></select></div></div><div class="form-group"><label>Observaciones de recepción</label><textarea id="compra-calidad-notas" class="form-control" rows="4" placeholder="Muestra, olor, color, defectos visibles, condición acordada…"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-compra-calidad')">Cancelar</button><button class="btn btn-primary" onclick="ComprasCafe.guardarCalidad()">Guardar revisión</button></div></div></div>`;
    },

    benefitModal() {
        return `<div id="modal-compra-beneficio" class="modal-overlay"><div class="modal-content"><div class="modal-header"><div><h3>↻ Procesar compra en beneficio</h3><p id="compra-beneficio-contexto"></p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-compra-beneficio')">×</button></div><div class="modal-body"><input id="compra-beneficio-id" type="hidden"/><div class="form-row-2"><div class="form-group"><label>Fecha inicio</label><input id="compra-beneficio-fecha" type="date" class="form-control" /></div><div class="form-group"><label>Fecha final</label><input id="compra-beneficio-fin" type="date" class="form-control" /></div></div><div class="form-row-2"><div class="form-group"><label>Kilos de materia prima</label><input id="compra-beneficio-entrada" type="number" step="0.1" class="form-control" /></div><div class="form-group"><label>Kilos de pergamino seco obtenidos *</label><input id="compra-beneficio-salida" type="number" step="0.1" class="form-control" /></div></div><div class="form-row-2"><div class="form-group"><label>Método</label><select id="compra-beneficio-metodo" class="form-control"><option value="lavado">Lavado</option><option value="honey">Honey</option><option value="natural">Natural</option><option value="semi-lavado">Semi-lavado</option></select></div><div class="form-group"><label>Humedad final (%)</label><input id="compra-beneficio-humedad" type="number" step="0.1" class="form-control" /></div></div><div class="form-group"><label>Observaciones</label><textarea id="compra-beneficio-notas" class="form-control" rows="2"></textarea></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-compra-beneficio')">Cancelar</button><button class="btn btn-primary" onclick="ComprasCafe.procesarCompra()">Registrar transformación</button></div></div></div>`;
    },

    async fillProviderSelect() {
        const select = document.getElementById('compra-proveedor');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccionar proveedor…</option>' + this.proveedores.map(item => `<option value="${item.id}">${Utils.escapar(item.nombre)} · ${Utils.escapar(item.tipo)}</option>`).join('');
    },

    async nuevaCompra() {
        if (!this.proveedores.length) { Utils.toast('Primero registre un proveedor de café.', 'error'); this.nuevoProveedor(); return; }
        Utils.limpiarForm('modal-compra-cafe');
        Utils.setVal('compra-fecha', Utils.hoy());
        Utils.setVal('compra-codigo', await window.api.comprasCafe.nextCode());
        Utils.setVal('compra-estado', 'pendiente');
        await this.fillProviderSelect();
        Utils.mostrarModal('modal-compra-cafe');
    },

    nuevoProveedor() { Utils.limpiarForm('modal-proveedor-cafe'); Utils.mostrarModal('modal-proveedor-cafe'); },

    actualizarCalculos(source) {
        let kg = Number(Utils.getVal('compra-kg') || 0), qq = Number(Utils.getVal('compra-qq') || 0), priceKg = Number(Utils.getVal('compra-precio-kg') || 0), priceQq = Number(Utils.getVal('compra-precio-qq') || 0);
        if (source === 'kg' && kg > 0) { qq = kg / 46; Utils.setVal('compra-qq', qq.toFixed(4)); }
        if (source === 'qq' && qq > 0) { kg = qq * 46; Utils.setVal('compra-kg', kg.toFixed(2)); }
        if (source === 'precioKg' && priceKg > 0) { priceQq = priceKg * 46; Utils.setVal('compra-precio-qq', priceQq.toFixed(2)); }
        if (source === 'precioQq' && priceQq > 0) { priceKg = priceQq / 46; Utils.setVal('compra-precio-kg', priceKg.toFixed(4)); }
        const total = kg * priceKg;
        const humidity = Number(Utils.getVal('compra-humedad') || 0);
        const product = Utils.getVal('compra-producto');
        const warning = ['pergamino_seco','verde'].includes(product) && humidity && (humidity < 8 || humidity > 14.5) ? '<span class="calculation-warning">⚠ Revise la humedad antes de aprobar la recepción.</span>' : '';
        const host = document.getElementById('compra-calculo');
        if (host) host.innerHTML = `<strong>${Utils.moneda(total)}</strong><span>${Utils.numero(kg,2)} kg · ${Utils.numero(qq,4)} qq · ${Utils.moneda(priceKg)}/kg</span>${warning}`;
    },

    async guardarProveedor() {
        const data = { codigo: Utils.getVal('proveedor-codigo'), nombre: Utils.getVal('proveedor-nombre'), tipo: Utils.getVal('proveedor-tipo'), identificacion: Utils.getVal('proveedor-id'), ubicacion: Utils.getVal('proveedor-ubicacion'), telefono: Utils.getVal('proveedor-telefono'), email: Utils.getVal('proveedor-email'), certificaciones: Utils.getVal('proveedor-certificaciones') };
        try { await window.api.proveedoresCafe.create(data); Utils.toast('Proveedor registrado.'); Utils.cerrarModal('modal-proveedor-cafe'); App.cargarPagina('compras'); } catch (error) { Utils.toast('❌ '+error.message,'error'); }
    },

    async guardarCompra() {
        const data = { codigo: Utils.getVal('compra-codigo'), fecha: Utils.getVal('compra-fecha'), temporada: Utils.getVal('compra-temporada'), proveedor_id: Utils.getVal('compra-proveedor'), tipo_producto: Utils.getVal('compra-producto'), estado_calidad: Utils.getVal('compra-estado'), cantidad_kg: Utils.getVal('compra-kg'), cantidad_qq: Utils.getVal('compra-qq'), precio_por_kg: Utils.getVal('compra-precio-kg'), precio_por_qq: Utils.getVal('compra-precio-qq'), humedad_porcentaje: Utils.getVal('compra-humedad'), defectos_porcentaje: Utils.getVal('compra-defectos'), variedad: Utils.getVal('compra-variedad'), lote_proveedor: Utils.getVal('compra-lote-proveedor'), finca_origen: Utils.getVal('compra-finca-origen'), origen_geografico: Utils.getVal('compra-origen'), ubicacion_recepcion: Utils.getVal('compra-ubicacion'), factura_comprobante: Utils.getVal('compra-factura'), observaciones: Utils.getVal('compra-observaciones') };
        try { const result = await window.api.comprasCafe.create(data); Utils.toast(result.warning ? `Compra guardada. ${result.warning}` : 'Compra registrada correctamente.', result.warning ? 'info' : 'success'); Utils.cerrarModal('modal-compra-cafe'); App.cargarPagina('compras'); } catch (error) { Utils.toast('❌ '+error.message,'error'); }
    },

    abrirCalidad(id) {
        const item = this.compras.find(row => Number(row.id) === Number(id));
        if (!item) return;
        Utils.setVal('compra-calidad-id', item.id);
        Utils.setVal('compra-calidad-humedad', item.humedad_porcentaje ?? '');
        Utils.setVal('compra-calidad-defectos', item.defectos_porcentaje ?? '');
        Utils.setVal('compra-calidad-estado', item.estado_calidad || 'pendiente');
        Utils.setVal('compra-calidad-notas', item.observaciones || '');
        document.getElementById('compra-calidad-contexto').textContent = `${item.codigo} · ${item.proveedor_nombre} · ${this.productLabel(item.tipo_producto)} · ${Utils.numero(item.cantidad_kg,1)} kg`;
        Utils.mostrarModal('modal-compra-calidad');
    },

    async guardarCalidad() {
        const id = Utils.getVal('compra-calidad-id');
        const data = {
            humedad_porcentaje: Utils.getVal('compra-calidad-humedad'),
            defectos_porcentaje: Utils.getVal('compra-calidad-defectos'),
            estado_calidad: Utils.getVal('compra-calidad-estado'),
            observaciones: Utils.getVal('compra-calidad-notas')
        };
        try {
            await window.api.comprasCafe.updateQuality(id, data);
            Utils.toast('Revisión de calidad actualizada.');
            Utils.cerrarModal('modal-compra-calidad');
            App.cargarPagina('compras');
        } catch (error) { Utils.toast('❌ '+error.message,'error'); }
    },

    async cambiarEstado(id, status) {
        const verb = { aprobado:'aprobar', condicionado:'marcar como condicionada', rechazado:'rechazar' }[status];
        if (!await Utils.confirmar(`¿Desea ${verb} esta recepción?`)) return;
        try { await window.api.comprasCafe.setStatus(id,status); Utils.toast('Estado actualizado.'); App.cargarPagina('compras'); } catch (error) { Utils.toast('❌ '+error.message,'error'); }
    },

    abrirBeneficio(id) {
        const item = this.compras.find(row => Number(row.id) === Number(id)); if (!item) return;
        Utils.setVal('compra-beneficio-id', id); Utils.setVal('compra-beneficio-fecha', item.fecha); Utils.setVal('compra-beneficio-fin', item.fecha); Utils.setVal('compra-beneficio-entrada', item.cantidad_kg); Utils.setVal('compra-beneficio-salida', ''); Utils.setVal('compra-beneficio-humedad', 11.5);
        document.getElementById('compra-beneficio-contexto').textContent = `${item.codigo} · ${item.proveedor_nombre} · ${Utils.numero(item.cantidad_kg,1)} kg`;
        Utils.mostrarModal('modal-compra-beneficio');
    },

    async procesarCompra() {
        const id = Utils.getVal('compra-beneficio-id');
        const data = { fecha_inicio: Utils.getVal('compra-beneficio-fecha'), fecha_fin: Utils.getVal('compra-beneficio-fin'), kilos_cereza_ingresados: Utils.getVal('compra-beneficio-entrada'), kilos_pergamino_seco: Utils.getVal('compra-beneficio-salida'), metodo: Utils.getVal('compra-beneficio-metodo'), humedad_final_porcentaje: Utils.getVal('compra-beneficio-humedad'), observaciones: Utils.getVal('compra-beneficio-notas') };
        try { await window.api.comprasCafe.sendToBenefit(id,data); Utils.toast('Compra enviada a beneficio e inventario actualizado.'); Utils.cerrarModal('modal-compra-beneficio'); App.cargarPagina('compras'); } catch (error) { Utils.toast('❌ '+error.message,'error'); }
    },

    async filtrar() {
        const filters = { tipo_producto: Utils.getVal('compra-filtro-producto'), estado_calidad: Utils.getVal('compra-filtro-calidad') };
        this.compras = await window.api.comprasCafe.getAll(filters);
        document.getElementById('compras-tbody').innerHTML = this.renderRows(this.compras);
    }
};
window.ComprasCafe = ComprasCafe;
