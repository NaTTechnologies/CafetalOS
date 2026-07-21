// ─── Cafetal OS — Módulo de Suscripción y Recomendaciones ───

const Suscripcion = {
    async cargar(container) {
        try {
            const perfiles = await window.api.suscripcion.getPerfiles();
            const clientes = await window.api.marketing.getClientes();
            const lotes = await window.api.lotes.getAll();

            container.innerHTML = `
                <div class="page-header">
                    <h2>📬 Suscripción Personalizada</h2>
                    <span style="color:var(--cafe-400);font-size:0.85rem;">Recomendaciones basadas en perfil de sabor</span>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:var(--verde-hoja);">
                            <div class="kpi-icon">👤</div>
                            <div class="kpi-value">${clientes.length}</div>
                            <div class="kpi-label">Perfiles de Cliente</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:var(--oro-cafe);">
                            <div class="kpi-icon">📋</div>
                            <div class="kpi-value">${perfiles.length}</div>
                            <div class="kpi-label">Perfiles de Sabor</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">🌳</div>
                            <div class="kpi-value">${lotes.length}</div>
                            <div class="kpi-label">Lotes Disponibles</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#9C27B0;">
                            <div class="kpi-icon">🎯</div>
                            <div class="kpi-value">${perfiles.reduce((s, p) => s + (p.intensidad || 0), 0) || '—'}</div>
                            <div class="kpi-label">Intensidad Total</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <!-- Perfiles de Sabor por Variedad -->
                        <div class="card">
                            <div class="card-header">🔬 Perfiles de Sabor por Variedad</div>
                            <div class="card-body">
                                ${perfiles.length === 0 ? `
                                    <p style="color:var(--cafe-400);">No hay perfiles de sabor configurados.</p>
                                    <button class="btn btn-sm btn-primary" onclick="Suscripcion.inicializarPerfiles()">⚙️ Inicializar Perfiles</button>
                                ` : `
                                    <div class="table-container">
                                        <table>
                                            <thead><tr><th>Variedad</th><th>Perfil</th><th>Altitud</th><th>Nota de Cata</th><th>Intensidad</th></tr></thead>
                                            <tbody>
                                                ${perfiles.map(p => `
                                                    <tr>
                                                        <td><strong>${Utils.escapar(p.variedad_nombre)}</strong></td>
                                                        <td><span class="badge badge-produccion">${p.perfil_principal}</span></td>
                                                        <td>${p.altitud_min || '—'} - ${p.altitud_max || '—'} msnm</td>
                                                        <td style="font-size:0.85rem;color:var(--cafe-500);">${Utils.escapar(p.nota_cata || '')}</td>
                                                        <td>${'⭐'.repeat(p.intensidad || 1)}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Recomendación para cliente -->
                        <div class="card">
                            <div class="card-header">🎯 Recomendación Personalizada</div>
                            <div class="card-body">
                                <div class="form-group">
                                    <label>Selecciona un Cliente</label>
                                    <select id="susc-cliente" class="form-control">
                                        <option value="">— Seleccionar —</option>
                                        ${clientes.map(c => `<option value="${c.id}">${Utils.escapar(c.nombre)} (${c.preferencia_sabor || 'sin perfil'})</option>`).join('')}
                                    </select>
                                </div>
                                <button class="btn btn-primary" onclick="Suscripcion.recomendar()">🎯 Recomendar</button>
                                <div id="susc-recomendacion" style="margin-top:12px;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Historial de recomendaciones -->
                    <div class="card mt-4">
                        <div class="card-header">📋 Historial de Recomendaciones</div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>Cliente</label>
                                <select id="susc-historial-cliente" class="form-control">
                                    <option value="">—</option>
                                    ${clientes.map(c => `<option value="${c.id}">${Utils.escapar(c.nombre)}</option>`).join('')}
                                </select>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="Suscripcion.verHistorial()">📋 Ver Historial</button>
                            <div id="susc-historial" style="margin-top:12px;"></div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error cargando suscripción:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar suscripción.</p></div>`;
        }
    },

    async inicializarPerfiles() {
        try {
            const perfilesData = [
                { variedad_id: 1, altitud_min: 1200, altitud_max: 1600, perfil_principal: 'chocolate', nota_cata: 'Chocolate amargo, caramelo, naranja', intensidad: 4 },
                { variedad_id: 2, altitud_min: 800, altitud_max: 1200, perfil_principal: 'citrico', nota_cata: 'Cítricos, miel, mandarina, panela', intensidad: 3 },
                { variedad_id: 3, altitud_min: 1000, altitud_max: 1500, perfil_principal: 'frutal', nota_cata: 'Frutos rojos, vino tinto, chocolate oscuro', intensidad: 4 },
                { variedad_id: 4, altitud_min: 800, altitud_max: 1200, perfil_principal: 'caramelo', nota_cata: 'Caramelo, almendra, cacao, panela', intensidad: 3 },
                { variedad_id: 5, altitud_min: 1300, altitud_max: 1800, perfil_principal: 'floral', nota_cata: 'Jazmín, bergamota, durazno, té verde', intensidad: 2 },
                { variedad_id: 6, altitud_min: 1000, altitud_max: 1500, perfil_principal: 'chocolate', nota_cata: 'Chocolate con leche, nueces, frutas secas', intensidad: 3 },
                { variedad_id: 7, altitud_min: 700, altitud_max: 1100, perfil_principal: 'herbal', nota_cata: 'Hierbas finas, cacao, tabaco, cuero', intensidad: 4 },
                { variedad_id: 8, altitud_min: 1200, altitud_max: 1600, perfil_principal: 'frutal', nota_cata: 'Frutas tropicales, cítricos, flores blancas', intensidad: 2 },
                { variedad_id: 9, altitud_min: 600, altitud_max: 1000, perfil_principal: 'chocolate', nota_cata: 'Chocolate, nueces, caramelo suave', intensidad: 3 },
                { variedad_id: 10, altitud_min: 1400, altitud_max: 1800, perfil_principal: 'floral', nota_cata: 'Jazmín, cacao fino, miel de abeja', intensidad: 2 }
            ];
            for (const p of perfilesData) {
                await window.api.suscripcion.crearPerfil(p);
            }
            Utils.toast('✅ Perfiles de sabor inicializados.');
            App.cargarPagina('suscripcion');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async recomendar() {
        const clienteId = document.getElementById('susc-cliente')?.value;
        const container = document.getElementById('susc-recomendacion');
        if (!clienteId || !container) { Utils.toast('⚠️ Selecciona un cliente.', 'error'); return; }
        try {
            const recomendaciones = await window.api.suscripcion.recomendar(parseInt(clienteId));
            if (!recomendaciones.length) {
                container.innerHTML = '<p style="color:var(--cafe-400);">No se encontraron recomendaciones.</p>';
                return;
            }
            container.innerHTML = `
                <h4 style="margin:0 0 8px;">📦 Tu Caja del Mes</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                    ${recomendaciones.map(r => `
                        <div style="border:1px solid var(--cafe-200);border-radius:8px;padding:12px;text-align:center;background:var(--cafe-50);">
                            <div style="font-size:1.5rem;">${Suscripcion.iconoPerfil(r.perfil_principal)}</div>
                            <div style="font-weight:700;color:var(--cafe-800);margin:8px 0 4px;">${Utils.escapar(r.codigo)}</div>
                            <div style="font-size:0.8rem;color:var(--cafe-500);">${Utils.escapar(r.variedad_nombre)}</div>
                            <div style="font-size:0.8rem;"><span class="badge badge-produccion">${r.perfil_principal}</span></div>
                            <div style="font-size:0.75rem;color:var(--cafe-400);margin-top:4px;">${r.nota_cata || ''}</div>
                            <div style="margin-top:8px;font-size:0.8rem;">${'⭐'.repeat(r.intensidad || 1)}</div>
                            <div style="margin-top:8px;display:flex;gap:4px;justify-content:center;">
                                <button class="btn btn-sm btn-success" onclick="Suscripcion.feedback(${r.id}, 'gusto', ${clienteId})">👍</button>
                                <button class="btn btn-sm btn-danger" onclick="Suscripcion.feedback(${r.id}, 'no_gusto', ${clienteId})">👎</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async feedback(loteId, feedback, clienteId) {
        try {
            await window.api.suscripcion.guardarFeedback({ cliente_id: clienteId, lote_id: loteId, feedback, fecha_recomendacion: Utils.hoy() });
            Utils.toast(feedback === 'gusto' ? '👍 ¡Nos alegra que te guste!' : '👎 Gracias por tu feedback.');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async verHistorial() {
        const clienteId = document.getElementById('susc-historial-cliente')?.value;
        const container = document.getElementById('susc-historial');
        if (!clienteId || !container) { Utils.toast('⚠️ Selecciona un cliente.', 'error'); return; }
        try {
            const historial = await window.api.suscripcion.getRecomendaciones(parseInt(clienteId));
            container.innerHTML = historial.length === 0 ? '<p style="color:var(--cafe-400);">Sin recomendaciones previas.</p>' : `
                <div class="table-container">
                    <table>
                        <thead><tr><th>Fecha</th><th>Lote</th><th>Feedback</th></tr></thead>
                        <tbody>
                            ${historial.map(h => `
                                <tr>
                                    <td>${h.fecha_recomendacion || h.created_at?.split('T')[0] || '—'}</td>
                                    <td>${Utils.escapar(h.lote_codigo || '—')}</td>
                                    <td>${h.feedback === 'gusto' ? '👍 Me gustó' : h.feedback === 'no_gusto' ? '👎 No me gustó' : '⏳ Pendiente'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    iconoPerfil(perfil) {
        const icons = { frutal: '🍓', chocolate: '🍫', caramelo: '🍬', floral: '🌸', herbal: '🌿', citrico: '🍊' };
        return icons[perfil] || '☕';
    }
};

window.Suscripcion = Suscripcion;
