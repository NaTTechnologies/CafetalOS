// ─── Cafetal OS — Módulo de Marketing Digital ───

const Marketing = {
    async cargar(container) {
        try {
            const clientes = await window.api.marketing.getClientes();
            const campañas = await window.api.marketing.getCampañas();
            const puntos = await window.api.marketing.getPuntosLealtad();
            const lotes = await window.api.lotes.getAll();

            container.innerHTML = `
                <div class="page-header">
                    <h2>📣 Marketing Digital</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-success" onclick="Marketing.mostrarFormCliente()">➕ Nuevo Cliente</button>
                        <button class="btn btn-outline" onclick="Marketing.mostrarFormCampaña()">📢 Nueva Campaña</button>
                    </div>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:var(--verde-hoja);">
                            <div class="kpi-icon">👥</div>
                            <div class="kpi-value">${clientes.length}</div>
                            <div class="kpi-label">Clientes Registrados</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:var(--oro-cafe);">
                            <div class="kpi-icon">📢</div>
                            <div class="kpi-value">${campañas.length}</div>
                            <div class="kpi-label">Campañas</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">⭐</div>
                            <div class="kpi-value">${puntos.reduce((s, p) => s + p.puntos, 0)}</div>
                            <div class="kpi-label">Puntos de Lealtad</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#9C27B0;">
                            <div class="kpi-icon">📱</div>
                            <div class="kpi-value">3</div>
                            <div class="kpi-label">Canales Digitales</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <!-- Clientes -->
                        <div class="card">
                            <div class="card-header">👥 Clientes y Preferencias</div>
                            <div class="card-body">
                                ${clientes.length === 0 ? '<p style="color:var(--cafe-400);">No hay clientes registrados.</p>' : `
                                    <div class="table-container">
                                        <table>
                                            <thead><tr><th>Nombre</th><th>Email</th><th>Preferencia</th><th>Puntos</th><th>Acción</th></tr></thead>
                                            <tbody>
                                                ${clientes.map(c => `
                                                    <tr>
                                                        <td><strong>${Utils.escapar(c.nombre)}</strong></td>
                                                        <td>${Utils.escapar(c.email || '—')}</td>
                                                        <td><span class="badge badge-produccion">${c.preferencia_sabor || '—'}</span></td>
                                                        <td><strong>${c.puntos_lealtad || 0}</strong> pts</td>
                                                        <td>
                                                            <button class="btn btn-sm btn-outline" onclick="Marketing.generarContenido(${c.id})">📝 Contenido</button>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Generador de contenido -->
                        <div class="card">
                            <div class="card-header">📝 Generador de Contenido Promocional</div>
                            <div class="card-body">
                                <div class="form-group">
                                    <label>Selecciona un Lote</label>
                                    <select id="mkt-lote" class="form-control">
                                        <option value="">—</option>
                                        ${lotes.map(l => `<option value="${l.id}">${l.codigo} — ${l.variedad_nombre || ''}</option>`).join('')}
                                    </select>
                                </div>
                                <button class="btn btn-primary" onclick="Marketing.generarPost()">✍️ Generar Post</button>
                                <div id="mkt-contenido" style="margin-top:12px;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Campañas -->
                    <div class="card mt-4">
                        <div class="card-header">📢 Campañas de Marketing</div>
                        <div class="card-body">
                            ${campañas.length === 0 ? '<p style="color:var(--cafe-400);">No hay campañas creadas.</p>' : `
                                <div class="table-container">
                                    <table>
                                        <thead><tr><th>Nombre</th><th>Tipo</th><th>Inicio</th><th>Estado</th><th></th></tr></thead>
                                        <tbody>
                                            ${campañas.map(c => `
                                                <tr>
                                                    <td><strong>${Utils.escapar(c.nombre)}</strong></td>
                                                    <td>${c.tipo}</td>
                                                    <td>${c.fecha_inicio || '—'}</td>
                                                    <td><span class="badge ${c.estado === 'activa' ? 'badge-produccion' : c.estado === 'borrador' ? 'badge-nuevo' : 'badge-reposicion'}">${c.estado}</span></td>
                                                    <td><button class="btn btn-sm btn-outline" onclick="Utils.toast('Contenido: ' + '${Utils.escapar((c.contenido || '').substring(0, 50))}')">📄 Ver</button></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Gamificación: Tabla de líderes -->
                    <div class="card">
                        <div class="card-header">⭐ Programa de Lealtad - Tabla de Líderes</div>
                        <div class="card-body">
                            ${puntos.length === 0 ? '<p style="color:var(--cafe-400);">Sin actividad de lealtad aún.</p>' : `
                                <div class="table-container">
                                    <table>
                                        <thead><tr><th>#</th><th>Cliente</th><th>Puntos</th><th>Concepto</th><th>Fecha</th></tr></thead>
                                        <tbody>
                                            ${puntos.map((p, i) => `
                                                <tr>
                                                    <td><strong>${i + 1}</strong></td>
                                                    <td>${Utils.escapar(p.cliente_nombre || '—')}</td>
                                                    <td><strong style="color:var(--oro-cafe);">+${p.puntos}</strong></td>
                                                    <td>${p.concepto || '—'}</td>
                                                    <td>${p.created_at ? p.created_at.split('T')[0] : '—'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                            <div style="margin-top:12px;">
                                <button class="btn btn-sm btn-outline" onclick="Marketing.mostrarFormPuntos()">⭐ Agregar Puntos</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error cargando marketing:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar marketing.</p></div>`;
        }
    },

    generarPost() {
        const loteId = document.getElementById('mkt-lote')?.value;
        const container = document.getElementById('mkt-contenido');
        if (!loteId || !container) { Utils.toast('⚠️ Selecciona un lote.', 'error'); return; }

        const perfiles = {
            geisha: { notas: 'jazmín, bergamota, durazno, té de jazmín', altura: '1,400-1,800 msnm', cuerpo: 'sedoso y elegante' },
            bourbon: { notas: 'chocolate con leche, caramelo, naranja', altura: '1,200-1,600 msnm', cuerpo: 'cremoso y redondo' },
            parainema: { notas: 'miel de abeja, cítricos, mandarina, panela', altura: '800-1,200 msnm', cuerpo: 'balanceado' },
            ihcafe90: { notas: 'chocolate oscuro, frutos rojos, vino tinto', altura: '1,000-1,400 msnm', cuerpo: 'robusto y complejo' },
            catuaí: { notas: 'almendra, cacao, panela, caramelo', altura: '900-1,300 msnm', cuerpo: 'medio y dulce' },
            typica: { notas: 'floral, cacao fino, miel, te verde', altura: '1,300-1,700 msnm', cuerpo: 'fino y aromático' },
            lempira: { notas: 'nueces, chocolate con leche, frutas secas', altura: '700-1,100 msnm', cuerpo: 'medio con buena acidez' }
        };

        const varietyNames = {
            geisha: 'Geisha', bourbon: 'Bourbon', parainema: 'Parainema', ihcafe90: 'IHCAFE 90',
            catuaí: 'Catuaí', typica: 'Typica', lempira: 'Lempira'
        };

        const selectedOption = document.querySelector('#mkt-lote option:checked');
        const codigo = selectedOption ? selectedOption.textContent.split('—')[0].trim() : 'Café de Honduras';
        const variedad = (selectedOption ? selectedOption.textContent.split('—')[1] || '' : '').trim().toLowerCase();

        const perfil = Object.keys(perfiles).find(k => variedad.includes(k)) || 'parainema';
        const p = perfiles[perfil] || perfiles.parainema;
        const vname = varietyNames[perfil] || 'Café de Especialidad';

        const contenido = `
            🌿 ${vname} de Honduras · Lote ${codigo}\n\n` +
            `☕ Perfil de Taza:\n` +
            `• Notas: ${p.notas}\n` +
            `• Altitud: ${p.altura}\n` +
            `• Cuerpo: ${p.cuerpo}\n` +
            `• Proceso: Lavado · Secado al sol\n\n` +
            `🌍 Producido en las montañas de Santa Bárbara, Honduras.\n` +
            `🏆 Café de especialidad 100% Arábica.\n\n` +
            `📦 Disponible para pedidos: [email/WhatsApp]\n` +
            `#CaféHonduras #Especialidad #CaféDeAltura`;

        container.innerHTML = `
            <div class="card" style="border-left:4px solid var(--oro-cafe);">
                <div class="card-body">
                    <div style="font-size:0.8rem;color:var(--cafe-400);margin-bottom:4px;">📱 Post Sugerido para Redes Sociales</div>
                    <div style="background:var(--crema);padding:16px;border-radius:8px;white-space:pre-wrap;font-size:0.9rem;line-height:1.6;font-family:inherit;">
                        ${contenido}
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText(\`${contenido.replace(/`/g, '\\`')}\`).then(() => Utils.toast('✅ Contenido copiado al portapapeles'))">📋 Copiar</button>
                        <button class="btn btn-sm btn-outline" onclick="Marketing.guardarCampanaDesdePost()">📢 Crear Campaña</button>
                    </div>
                </div>
            </div>
        `;
    },

    async guardarCampanaDesdePost() {
        const contenido = document.querySelector('#mkt-contenido .card-body div:nth-child(2)')?.textContent || '';
        try {
            await window.api.marketing.crearCampaña({
                nombre: 'Post generado - ' + Utils.hoy(),
                tipo: 'redes',
                contenido: contenido.substring(0, 500),
                fecha_inicio: Utils.hoy(),
                estado: 'borrador'
            });
            Utils.toast('✅ Campaña guardada como borrador.');
            App.cargarPagina('marketing');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    mostrarFormCliente() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-mkt-cliente';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>👥 Nuevo Cliente</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-mkt-cliente')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-mkt-cliente" onsubmit="return false;">
                        <div class="form-group">
                            <label>Nombre *</label>
                            <input type="text" id="mkt-cliente-nombre" class="form-control" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="mkt-cliente-email" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="text" id="mkt-cliente-telefono" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Preferencia de Sabor</label>
                            <select id="mkt-cliente-sabor" class="form-control">
                                <option value="frutal">🍓 Frutal</option>
                                <option value="chocolate">🍫 Chocolate</option>
                                <option value="caramelo">🍬 Caramelo</option>
                                <option value="floral">🌸 Floral</option>
                                <option value="herbal">🌿 Herbal</option>
                                <option value="citrico">🍊 Cítrico</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-mkt-cliente')">Cancelar</button>
                    <button class="btn btn-success" onclick="Marketing.guardarCliente()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async guardarCliente() {
        const nombre = Utils.getVal('mkt-cliente-nombre');
        if (!nombre) { Utils.toast('⚠️ El nombre es requerido.', 'error'); return; }
        try {
            await window.api.marketing.crearCliente({
                nombre, email: Utils.getVal('mkt-cliente-email'), telefono: Utils.getVal('mkt-cliente-telefono'),
                preferencia_sabor: document.getElementById('mkt-cliente-sabor')?.value, puntos_lealtad: 0, activo: 1
            });
            Utils.toast('✅ Cliente registrado.');
            Utils.cerrarModal('modal-mkt-cliente');
            App.cargarPagina('marketing');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    mostrarFormCampaña() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-mkt-campana';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3>📢 Nueva Campaña</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-mkt-campana')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-mkt-campana" onsubmit="return false;">
                        <div class="form-group">
                            <label>Nombre *</label>
                            <input type="text" id="mkt-campana-nombre" class="form-control" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tipo</label>
                                <select id="mkt-campana-tipo" class="form-control">
                                    <option value="email">📧 Email Marketing</option>
                                    <option value="redes">📱 Redes Sociales</option>
                                    <option value="lealtad">⭐ Programa Lealtad</option>
                                    <option value="recomendacion">🗣️ Recomendación</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Estado</label>
                                <select id="mkt-campana-estado" class="form-control">
                                    <option value="borrador">📝 Borrador</option>
                                    <option value="activa">🚀 Activa</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Inicio</label><input type="date" id="mkt-campana-inicio" class="form-control" value="${Utils.hoy()}"></div>
                            <div class="form-group"><label>Fin</label><input type="date" id="mkt-campana-fin" class="form-control"></div>
                        </div>
                        <div class="form-group">
                            <label>Contenido</label>
                            <textarea id="mkt-campana-contenido" class="form-control" rows="4" placeholder="Describe tu campaña..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-mkt-campana')">Cancelar</button>
                    <button class="btn btn-success" onclick="Marketing.guardarCampana()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async guardarCampana() {
        const nombre = Utils.getVal('mkt-campana-nombre');
        if (!nombre) { Utils.toast('⚠️ El nombre es requerido.', 'error'); return; }
        try {
            await window.api.marketing.crearCampaña({
                nombre, tipo: document.getElementById('mkt-campana-tipo')?.value,
                contenido: Utils.getVal('mkt-campana-contenido') || '',
                fecha_inicio: Utils.getVal('mkt-campana-inicio'),
                fecha_fin: Utils.getVal('mkt-campana-fin'),
                estado: document.getElementById('mkt-campana-estado')?.value
            });
            Utils.toast('✅ Campaña creada.');
            Utils.cerrarModal('modal-mkt-campana');
            App.cargarPagina('marketing');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    mostrarFormPuntos() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-mkt-puntos';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:450px;">
                <div class="modal-header">
                    <h3>⭐ Agregar Puntos de Lealtad</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-mkt-puntos')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-mkt-puntos" onsubmit="return false;">
                        <div class="form-group">
                            <label>Cliente</label>
                            <select id="mkt-puntos-cliente" class="form-control"></select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Puntos</label>
                                <input type="number" id="mkt-puntos-cantidad" class="form-control" value="10" min="1">
                            </div>
                            <div class="form-group">
                                <label>Concepto</label>
                                <select id="mkt-puntos-concepto" class="form-control">
                                    <option value="compra">🛒 Compra</option>
                                    <option value="recomendacion">🗣️ Recomendación</option>
                                    <option value="review">⭐ Review</option>
                                    <option value="cumpleanos">🎂 Cumpleaños</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-mkt-puntos')">Cancelar</button>
                    <button class="btn btn-success" onclick="Marketing.guardarPuntos()">✅ Guardar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        window.api.marketing.getClientes().then(clientes => {
            const select = document.getElementById('mkt-puntos-cliente');
            if (!select) return;
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = c.nombre;
                select.appendChild(opt);
            });
        });
    },

    async guardarPuntos() {
        const cliente_id = Utils.getVal('mkt-puntos-cliente');
        const puntos = Utils.getVal('mkt-puntos-cantidad');
        const concepto = document.getElementById('mkt-puntos-concepto')?.value;
        if (!cliente_id || !puntos) { Utils.toast('⚠️ Completa todos los campos.', 'error'); return; }
        try {
            await window.api.marketing.agregarPuntos({ cliente_id, puntos, concepto });
            Utils.toast(`✅ ${puntos} puntos agregados.`);
            Utils.cerrarModal('modal-mkt-puntos');
            App.cargarPagina('marketing');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    generarContenido(clienteId) {
        // Genera contenido personalizado para un cliente
        Utils.toast('📝 Función de contenido personalizado próxima.');
    }
};

window.Marketing = Marketing;
