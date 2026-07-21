// ─── Módulo: Mi Finca ───

const Finca = {
    datos: null,

    async cargar(container) {
        try {
            this.datos = await window.api.finca.get() || {};
            const certificaciones = await window.api.certificaciones.getAll().catch(() => []);
            
            container.innerHTML = `
                <div class="page-header">
                    <h2>🏘️ Mi Finca</h2>
                    <button class="btn btn-primary" onclick="Finca.guardar()">💾 Guardar Cambios</button>
                </div>
                <div class="page-body">
                    <div class="card">
                        <div class="card-header">Datos Generales</div>
                        <div class="card-body">
                            <div class="form-row-4">
                                <div class="form-group">
                                    <label>Nombre de la Finca</label>
                                    <input type="text" id="finca-nombre" class="form-control" 
                                        value="${Utils.escapar(this.datos.nombre || '')}" placeholder="Ej: El Paraíso">
                                </div>
                                <div class="form-group">
                                    <label>Ubicación</label>
                                    <input type="text" id="finca-ubicacion" class="form-control" 
                                        value="${Utils.escapar(this.datos.ubicacion || '')}" placeholder="Aldea, municipio, dpto.">
                                </div>
                                <div class="form-group">
                                    <label>Altitud (msnm)</label>
                                    <input type="number" id="finca-altitud" class="form-control" 
                                        value="${this.datos.altitud_msnm || ''}" placeholder="Ej: 1200">
                                </div>
                                <div class="form-group">
                                    <label>Coordenadas</label>
                                    <input type="text" id="finca-coordenadas" class="form-control" 
                                        value="${Utils.escapar(this.datos.coordenadas || '')}" placeholder="Lat, Long">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Área Total (mz)</label>
                                    <input type="number" id="finca-area-total" class="form-control" step="0.1"
                                        value="${this.datos.area_total_mz || ''}" placeholder="Manzanas">
                                </div>
                                <div class="form-group">
                                    <label>Área Sembrada de Café (mz)</label>
                                    <input type="number" id="finca-area-cafe" class="form-control" step="0.1"
                                        value="${this.datos.area_cafe_mz || ''}" placeholder="Manzanas">
                                </div>
                                <div class="form-group">
                                    <label>Certificaciones</label>
                                    <input type="text" id="finca-certificaciones" class="form-control"
                                        value="${Utils.escapar(this.datos.certificaciones || '')}" placeholder="Orgánico, Rainforest, etc.">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Certificaciones activas -->
                ${certificaciones.length > 0 ? `
                    <div class="card">
                        <div class="card-header">🏆 Certificaciones Vigentes</div>
                        <div class="card-body">
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                ${certificaciones.map(c => {
                                    const icons = { organico: '🌱', rainforest: '🐸', comercio_justo: '🤝', utz: '✅', carbon_neutral: '🌍', bird_friendly: '🐦', '4c': '📋' };
                                    return `<span class="cert-badge">${icons[c.tipo] || '🏆'} ${c.tipo.replace(/_/g, ' ')}${c.entidad_certificadora ? ' · ' + Utils.escapar(c.entidad_certificadora) : ''}</span>`;
                                }).join('')}
                            </div>
                            <p style="margin:8px 0 0;font-size:0.8rem;color:var(--cafe-400);">
                                🌱 Gestiona tus certificaciones desde el módulo <a href="#" onclick="App.cargarPagina('sostenibilidad');return false;">Sostenibilidad</a>
                            </p>
                        </div>
                    </div>
                ` : `
                    <div class="card">
                        <div class="card-body text-center" style="padding:12px;">
                            <span style="color:var(--cafe-400);font-size:0.85rem;">🏆 Sin certificaciones registradas. </span>
                            <a href="#" onclick="App.cargarPagina('sostenibilidad');return false;" style="color:var(--cafe-600);font-weight:600;">Gestionar en Sostenibilidad →</a>
                        </div>
                    </div>
                `}
            `;
        } catch (err) {
            console.error('Error cargando finca:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar datos de la finca.</p></div>`;
        }
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'finca-nombre': ['required'],
            'finca-ubicacion': ['required'],
            'finca-area-total': ['number'],
            'finca-area-cafe': ['number'],
            'finca-altitud': ['number']
        };
        if (!Validador.validarForm(campos)) return;

        const data = {
            nombre: Utils.getVal('finca-nombre'),
            ubicacion: Utils.getVal('finca-ubicacion'),
            altitud_msnm: Utils.getVal('finca-altitud'),
            area_total_mz: Utils.getVal('finca-area-total'),
            area_cafe_mz: Utils.getVal('finca-area-cafe'),
            certificaciones: Utils.getVal('finca-certificaciones'),
            coordenadas: Utils.getVal('finca-coordenadas')
        };

        try {
            await window.api.finca.update(data);
            Utils.toast('✅ Datos de la finca guardados correctamente');
        } catch (err) {
            Utils.toast('❌ Error al guardar: ' + err.message, 'error');
        }
    }
};

window.Finca = Finca;
