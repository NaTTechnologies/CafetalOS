// ─── Cafetal OS — Módulo de Trazabilidad Blockchain ───

const Trazabilidad = {
    async cargar(container) {
        try {
            const cadena = await window.api.trazabilidad.getCadena();
            const verificacion = await window.api.trazabilidad.verificar();
            const lotes = await window.api.lotes.getAll();

            container.innerHTML = `
                <div class="page-header">
                    <h2>🔗 Trazabilidad Blockchain</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-success" onclick="Trazabilidad.registrarBloque()">⛓️ Nuevo Bloque</button>
                        <button class="btn btn-outline" onclick="Trazabilidad.verificarCadena()">✅ Verificar Integridad</button>
                    </div>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:${verificacion.valido ? 'var(--verde-hoja)' : 'var(--rojo-cafe)'};">
                            <div class="kpi-icon">${verificacion.valido ? '✅' : '❌'}</div>
                            <div class="kpi-value">${verificacion.total_bloques}</div>
                            <div class="kpi-label">Bloques en la Cadena</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">🔐</div>
                            <div class="kpi-value">SHA-256</div>
                            <div class="kpi-label">Algoritmo de Hash</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#9C27B0;">
                            <div class="kpi-icon">🏛️</div>
                            <div class="kpi-value">${verificacion.valido ? 'Íntegra' : '⚠️ Alterada'}</div>
                            <div class="kpi-label">Estado de la Cadena</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:var(--oro-cafe);">
                            <div class="kpi-icon">🌍</div>
                            <div class="kpi-value">${lotes.length}</div>
                            <div class="kpi-label">Lotes con Trazabilidad</div>
                        </div>
                    </div>

                    <!-- Generar código de trazabilidad por lote -->
                    <div class="card">
                        <div class="card-header">📋 Códigos de Trazabilidad por Lote</div>
                        <div class="card-body">
                            <p style="font-size:0.85rem;color:var(--cafe-500);margin:0 0 12px;">
                                Cada lote puede tener un código único de trazabilidad (formato: HND-XXXXXXXX) 
                                que permite rastrear toda su cadena de custodia.
                            </p>
                            <div class="table-container">
                                <table>
                                    <thead><tr><th>Lote</th><th>Código Trazabilidad</th><th>Variedad</th><th>Estado</th><th>Acción</th></tr></thead>
                                    <tbody id="trazabilidad-lotes-tbody">
                                        ${lotes.map(l => `
                                            <tr>
                                                <td><strong>${Utils.escapar(l.codigo)}</strong></td>
                                                <td id="codigo-${l.id}">
                                                    <span style="color:var(--cafe-400);font-family:monospace;font-size:0.85rem;">
                                                        (sin código)
                                                    </span>
                                                </td>
                                                <td>${Utils.escapar(l.variedad_nombre || '—')}</td>
                                                <td><span class="badge badge-produccion">${l.estado}</span></td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary" onclick="Trazabilidad.generarCodigoLote(${l.id})">🔗 Generar</button>
                                                    <button class="btn btn-sm btn-info" onclick="Trazabilidad.mostrarQR(${l.id})" title="Ver código QR">📱 QR</button>
                                                    <button class="btn btn-sm btn-outline" onclick="Trazabilidad.verRutaCompleta(${l.id})">📋 Ruta</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Cadena de Bloques Visual -->
                    <div class="card">
                        <div class="card-header flex-between">
                            <span>⛓️ Cadena de Bloques ${!verificacion.valido ? `<span style="color:var(--rojo-cafe);font-weight:700;"> ⚠️ ¡Cadena Alterada!</span>` : ''}</span>
                        </div>
                        <div class="card-body">
                            ${cadena.length === 0 ? '<p style="color:var(--cafe-400);">No hay bloques en la cadena. ¡Registra el primer bloque!</p>' : `
                                <div id="trazabilidad-cadena-visual" style="display:flex;flex-direction:column;gap:8px;">
                                    ${cadena.map((b, i) => `
                                        <div style="background:${verificacion.valido ? 'var(--cafe-50)' : '#FFEBEE'};border-radius:8px;border:1px solid ${verificacion.valido ? 'var(--cafe-200)' : 'var(--rojo-cafe)'};padding:4px;">
                                            <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;cursor:pointer;" onclick="Trazabilidad.toggleBloque(${b.id})">
                                                <div style="width:32px;height:32px;border-radius:50%;background:var(--cafe-700);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">
                                                    ${cadena.length - i}
                                                </div>
                                                <div style="flex:1;">
                                                    <div style="font-weight:600;font-size:0.9rem;color:var(--cafe-800);">
                                                        ${Trazabilidad.nombreTipo(b.tipo_registro)} 
                                                        <span style="font-weight:400;color:var(--cafe-400);font-size:0.8rem;">#${b.registro_id}</span>
                                                    </div>
                                                    <div style="font-size:0.75rem;color:var(--cafe-400);font-family:monospace;">
                                                        ${b.timestamp}
                                                    </div>
                                                </div>
                                                <div style="font-size:0.7rem;color:var(--cafe-400);font-family:monospace;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                                    ${b.hash_bloque.substring(0, 16)}...
                                                </div>
                                                <span style="font-size:0.8rem;">▶️</span>
                                            </div>
                                            <div id="bloque-detalle-${b.id}" style="display:none;padding:8px 16px 12px;border-top:1px solid var(--cafe-100);">
                                                <div style="font-size:0.8rem;display:grid;grid-template-columns:80px 1fr;gap:4px 12px;">
                                                    <span style="color:var(--cafe-400);">Hash:</span>
                                                    <span style="font-family:monospace;word-break:break-all;">${b.hash_bloque}</span>
                                                    <span style="color:var(--cafe-400);">Anterior:</span>
                                                    <span style="font-family:monospace;word-break:break-all;">${b.hash_anterior}</span>
                                                    <span style="color:var(--cafe-400);">Timestamp:</span>
                                                    <span>${b.timestamp}</span>
                                                    <span style="color:var(--cafe-400);">Datos:</span>
                                                    <span>${b.datos_resumen || '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Certificado de Trazabilidad -->
                    <div class="card" style="border-left:4px solid var(--cafe-600);">
                        <div class="card-header">📄 Certificado de Trazabilidad</div>
                        <div class="card-body">
                            <p style="margin:0 0 8px;font-size:0.85rem;color:var(--cafe-500);">
                                Genera un certificado PDF con la cadena de custodia completa y el hash de verificación.
                            </p>
                            <button class="btn btn-primary" onclick="Trazabilidad.exportarCertificado()">📥 Exportar Certificado</button>
                        </div>
                    </div>
                </div>
            `;

            // Cargar códigos de trazabilidad existentes
            this.cargarCodigosExistentes(lotes);

        } catch (err) {
            console.error('Error cargando trazabilidad:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar trazabilidad.</p></div>`;
        }
    },

    async cargarCodigosExistentes(lotes) {
        for (const l of lotes) {
            try {
                const r = await window.api.trazabilidad.getByLote(l.id);
                const td = document.getElementById(`codigo-${l.id}`);
                if (td && r && r.length > 0) {
                    td.innerHTML = `<span style="font-family:monospace;font-weight:600;color:var(--verde-cafe);cursor:pointer;" onclick="Trazabilidad.mostrarQR(${l.id})" title="Click para QR">${Utils.escapar(r[0].codigo_trazabilidad)} 📱</span>`;
                }
            } catch (e) {}
        }
    },

    async mostrarQR(lote_id) {
        try {
            const lotes = await window.api.lotes.getAll();
            const lote = lotes.find(l => l.id === lote_id);
            if (!lote) { Utils.toast('⚠️ Lote no encontrado.', 'error'); return; }

            const codigos = await window.api.trazabilidad.getByLote(lote_id);
            const codigoTrazabilidad = codigos && codigos.length > 0 ? codigos[0].codigo_trazabilidad : 'SIN-CODIGO';

            // Generar texto para QR: datos del lote y código
            const textoQR = JSON.stringify({
                app: 'Cafetal OS',
                lote: lote.codigo || `Lote #${lote_id}`,
                codigo: codigoTrazabilidad,
                variedad: lote.variedad_nombre || '—',
                altitud: lote.altitud_msnm || '—',
                finca: 'Finca Cafetal OS',
                verificar: `https://cafetalos.local/trazabilidad/${codigoTrazabilidad}`
            }, null, 2);

            const result = await window.api.trazabilidad.generarQR({ texto: textoQR, lote_id });
            if (result.error) { Utils.toast('❌ Error generando QR: ' + result.error, 'error'); return; }

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.id = 'modal-qr-trazabilidad';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width:420px;text-align:center;">
                    <div class="modal-header">
                        <h3>📱 Código QR - ${Utils.escapar(lote.codigo || `Lote #${lote_id}`)}</h3>
                        <button class="modal-close" onclick="Utils.cerrarModal('modal-qr-trazabilidad')">&times;</button>
                    </div>
                    <div class="modal-body" style="padding:24px;">
                        <div style="background:white;border-radius:12px;padding:16px;display:inline-block;box-shadow:0 2px 12px rgba(0,0,0,0.1);">
                            <img src="${result.qr}" alt="QR Code" style="width:260px;height:260px;image-rendering:pixelated;">
                        </div>
                        <p style="margin:12px 0 4px;font-family:monospace;font-weight:600;color:var(--cafe-700);font-size:0.9rem;">
                            ${Utils.escapar(codigoTrazabilidad)}
                        </p>
                        <p style="margin:0;font-size:0.75rem;color:var(--cafe-400);">
                            Escanea para verificar la trazabilidad del lote
                        </p>
                    </div>
                    <div class="modal-footer" style="justify-content:center;">
                        <button class="btn btn-primary" onclick="Trazabilidad.descargarQR()">📥 Descargar QR</button>
                        <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-qr-trazabilidad')">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Guardar datos para descarga
            this._ultimoQR = { dataURL: result.qr, codigo: codigoTrazabilidad, lote: lote.codigo || `Lote #${lote_id}` };

        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async descargarQR() {
        if (!this._ultimoQR) { Utils.toast('⚠️ No hay QR generado.', 'error'); return; }
        try {
            const link = document.createElement('a');
            link.download = `QR_${this._ultimoQR.codigo || this._ultimoQR.lote}.png`;
            link.href = this._ultimoQR.dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Utils.toast(`✅ QR descargado: ${link.download}`);
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async generarCodigoLote(lote_id) {
        try {
            const result = await window.api.trazabilidad.crearCodigo({ lote_id });
            if (result && result.codigo_trazabilidad) {
                Utils.toast(`✅ Código generado: ${result.codigo_trazabilidad}`);
                App.cargarPagina('trazabilidad');
            }
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async verRutaCompleta(lote_id) {
        try {
            const ruta = await window.api.trazabilidad.getRutaCompleta(lote_id);
            if (!ruta || !ruta.lote) {
                Utils.toast('⚠️ Este lote no tiene trazabilidad registrada.', 'error');
                return;
            }
            const tipos = ['finca', 'lote', 'cosecha', 'beneficio', 'inventario', 'venta'];
            const bloquesPorTipo = {};
            (ruta.bloques || []).forEach(b => { bloquesPorTipo[b.tipo_registro] = b; });

            let html = `<div style="padding:8px 0;">
                <h4 style="margin:0 0 12px;">📋 Ruta de Custodia: ${ruta.lote.codigo_trazabilidad}</h4>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">`;
            tipos.forEach((tipo, i) => {
                const bloque = bloquesPorTipo[tipo];
                const conectado = i < tipos.length - 1 ? '<span style="color:var(--cafe-300);font-size:1.2rem;"> → </span>' : '';
                html += `<div style="flex:1;min-width:100px;padding:10px;border-radius:6px;background:${bloque ? 'var(--cafe-50)' : '#F5F5F5'};text-align:center;border:1px solid ${bloque ? 'var(--cafe-300)' : '#E0E0E0'};">
                    <div style="font-size:1.3rem;">${this.iconoTipo(tipo)}</div>
                    <div style="font-size:0.75rem;font-weight:600;color:${bloque ? 'var(--cafe-800)' : '#BDBDBD'};">${this.nombreTipo(tipo)}</div>
                    <div style="font-size:0.65rem;color:${bloque ? 'var(--verde-cafe)' : '#BDBDBD'};">${bloque ? '✅ Registrado' : '⏳ Pendiente'}</div>
                </div>${conectado}`;
            });
            html += `</div></div>`;

            // Mostrar en modal
            this.mostrarModalRuta(html, ruta);
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    mostrarModalRuta(html, ruta) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-ruta-trazabilidad';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:700px;">
                <div class="modal-header">
                    <h3>📋 Cadena de Custodia</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-ruta-trazabilidad')">&times;</button>
                </div>
                <div class="modal-body">
                    ${html}
                    <div style="margin-top:16px;">
                        <h4 style="margin:0 0 8px;">⛓️ Bloques Relacionados</h4>
                        ${(ruta.bloques || []).length === 0 ? '<p style="color:var(--cafe-400);">Sin bloques registrados.</p>' : `
                            <div class="table-container">
                                <table>
                                    <thead><tr><th>Tipo</th><th>Hash</th><th>Fecha</th></tr></thead>
                                    <tbody>
                                        ${ruta.bloques.map(b => `<tr>
                                            <td>${this.nombreTipo(b.tipo_registro)}</td>
                                            <td style="font-family:monospace;font-size:0.7rem;">${b.hash_bloque.substring(0, 20)}...</td>
                                            <td>${b.timestamp}</td>
                                        </tr>`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-ruta-trazabilidad')">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async verificarCadena() {
        const result = await window.api.trazabilidad.verificar();
        if (result.valido) {
            Utils.toast(`✅ Cadena íntegra: ${result.total_bloques} bloques verificados.`);
        } else {
            Utils.toast(`❌ Cadena alterada: ${result.errores.length} error(es) encontrados.`, 'error');
        }
        App.cargarPagina('trazabilidad');
    },

    async registrarBloque() {
        const tipos = ['finca', 'lote', 'cosecha', 'beneficio', 'inventario', 'venta'];
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-nuevo-bloque';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>⛓️ Registrar Nuevo Bloque</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-nuevo-bloque')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-bloque" onsubmit="return false;">
                        <div class="form-group">
                            <label>Tipo de Registro</label>
                            <select id="bloque-tipo" class="form-control">
                                ${tipos.map(t => `<option value="${t}">${this.nombreTipo(t)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ID del Registro</label>
                            <input type="number" id="bloque-registro-id" class="form-control" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Detalles (JSON opcional)</label>
                            <textarea id="bloque-datos" class="form-control" rows="3" placeholder='{"key": "value"}'></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-nuevo-bloque')">Cancelar</button>
                    <button class="btn btn-success" onclick="Trazabilidad.guardarBloque()">⛓️ Generar Hash</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async guardarBloque() {
        const tipo_registro = document.getElementById('bloque-tipo')?.value;
        const registro_id = parseInt(document.getElementById('bloque-registro-id')?.value);
        const datos_resumen = document.getElementById('bloque-datos')?.value;
        if (!tipo_registro || !registro_id) { Utils.toast('⚠️ Completa todos los campos.', 'error'); return; }
        try {
            const result = await window.api.trazabilidad.generarHash({
                tipo_registro, registro_id,
                datos_resumen: datos_resumen ? JSON.parse(datos_resumen) : { tipo: tipo_registro }
            });
            Utils.toast(`✅ Bloque registrado. Hash: ${result.hash.substring(0, 16)}...`);
            Utils.cerrarModal('modal-nuevo-bloque');
            App.cargarPagina('trazabilidad');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    toggleBloque(id) {
        const detalle = document.getElementById(`bloque-detalle-${id}`);
        if (detalle) detalle.style.display = detalle.style.display === 'none' ? 'block' : 'none';
    },

    async exportarCertificado() {
        try {
            const cadena = await window.api.trazabilidad.getCadena();
            const verificacion = await window.api.trazabilidad.verificar();
            const finca = await window.api.finca.get() || {};

            let contenido = `CERTIFICADO DE TRAZABILIDAD - Cafetal OS\n\n` +
                `Finca: ${finca.nombre || 'No especificada'}\n` +
                `Ubicación: ${finca.ubicacion || '—'}\n\n` +
                `ESTADO DE LA CADENA: ${verificacion.valido ? '✅ ÍNTEGRA' : '❌ ALTERADA'}\n` +
                `Bloques: ${verificacion.total_bloques}\n` +
                `Algoritmo: SHA-256\n\n` +
                `REGISTROS EN LA CADENA:\n` +
                cadena.map(b => `- [${b.timestamp}] ${this.nombreTipo(b.tipo_registro)} #${b.registro_id}: ${b.hash_bloque.substring(0, 20)}...`).join('\n') + '\n\n' +
                `--- Generado por Cafetal OS v1.0 el ${Utils.hoy()} ---\n` +
                `Verificación: Este certificado valida la integridad de la cadena de custodia.`;

            const result = await window.api.exportar.pdf({ tipo: 'trazabilidad', titulo: `Certificado_Trazabilidad_${Utils.hoy()}`, contenidoHtml: contenido });
            if (result) Utils.toast(`✅ Certificado guardado: ${result}`);
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    // ─── Helpers ───
    nombreTipo(tipo) {
        const nombres = { finca: '🏘️ Finca', lote: '🌳 Lote', cosecha: '📅 Cosecha', beneficio: '🔄 Beneficio', inventario: '📦 Inventario', venta: '💰 Venta' };
        return nombres[tipo] || tipo;
    },

    iconoTipo(tipo) {
        const icons = { finca: '🏘️', lote: '🌳', cosecha: '📅', beneficio: '🔄', inventario: '📦', venta: '💰' };
        return icons[tipo] || '📋';
    }
};

window.Trazabilidad = Trazabilidad;
