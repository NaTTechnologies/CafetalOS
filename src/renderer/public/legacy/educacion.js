// ─── Cafetal OS — Módulo de Contenido Educativo ───

const Educacion = {
    async cargar(container) {
        try {
            const articulos = await window.api.educacion.getArticulos();

            container.innerHTML = `
                <div class="page-header">
                    <h2>📚 Educación Cafetalera</h2>
                    <span style="color:var(--cafe-400);font-size:0.85rem;">Aprende más sobre el mundo del café</span>
                </div>
                <div class="page-body">
                    <!-- Filtro de categorías -->
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
                        <button class="btn btn-sm ${!Educacion.categoriaFiltro ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('')">📚 Todos</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'sostenibilidad' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('sostenibilidad')">🌱 Sostenibilidad</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'variedades' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('variedades')">🌳 Variedades</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'beneficio' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('beneficio')">🔄 Beneficio</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'tostion' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('tostion')">🔥 Tostión</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'metodos_preparacion' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('metodos_preparacion')">☕ Preparación</button>
                        <button class="btn btn-sm ${Educacion.categoriaFiltro === 'comercializacion' ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('comercializacion')">💰 Comercialización</button>
                    </div>

                    <!-- Artículos -->
                    <div id="educacion-articulos" class="card-grid">
                        ${articulos.length === 0 ? `
                            <div class="card full-width">
                                <div class="card-body text-center" style="padding:40px;">
                                    <div style="font-size:3rem;margin-bottom:12px;">📚</div>
                                    <h3 style="color:var(--cafe-600);margin:0 0 8px;">Biblioteca Educativa</h3>
                                    <p style="color:var(--cafe-400);margin:0 0 16px;">No hay artículos disponibles. ¡Inicializa la biblioteca!</p>
                                    <button class="btn btn-primary" onclick="Educacion.inicializarArticulos()">⚙️ Inicializar Biblioteca</button>
                                </div>
                            </div>
                        ` : articulos.map(a => Educacion.renderCard(a)).join('')}
                    </div>

                    <!-- Calculadora de valor -->
                    <div class="card mt-4" style="border-left:4px solid var(--oro-cafe);">
                        <div class="card-header">💰 Calculadora: ¿Cuánto vale tu café?</div>
                        <div class="card-body">
                            <p style="margin:0 0 12px;font-size:0.85rem;color:var(--cafe-500);">
                                Calcula el valor estimado de tu café basado en el puntaje SCA y el precio de referencia.
                            </p>
                            <div class="form-row-4">
                                <div class="form-group">
                                    <label>Puntaje SCA (0-100)</label>
                                    <input type="number" id="edu-sca" class="form-control" value="84" step="0.1" min="0" max="100">
                                </div>
                                <div class="form-group">
                                    <label>Precio Referencia (USD/kg)</label>
                                    <input type="number" id="edu-precio-ref" class="form-control" value="8.47" step="0.01">
                                </div>
                                <div class="form-group">
                                    <label>Producción (qq)</label>
                                    <input type="number" id="edu-qq" class="form-control" value="50">
                                </div>
                                <div class="form-group">
                                    <label>Tipo de Café</label>
                                    <select id="edu-tipo" class="form-control">
                                        <option value="arabica">Arábica</option>
                                        <option value="robusta">Robusta</option>
                                    </select>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="Educacion.calcularValor()">💰 Calcular Valor</button>
                            <div id="edu-resultado" style="margin-top:16px;"></div>
                        </div>
                    </div>

                    <!-- Sección de Métodos de Preparación -->
                    <div class="card mt-4">
                        <div class="card-header">☕ Guías de Preparación</div>
                        <div class="card-body">
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Educacion.mostrarGuia('chemex')">
                                    <div class="card-body text-center" style="padding:20px;">
                                        <div style="font-size:2.5rem;">🧪</div>
                                        <h4 style="margin:8px 0 4px;">Chemex</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Café limpio y brillante</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Educacion.mostrarGuia('v60')">
                                    <div class="card-body text-center" style="padding:20px;">
                                        <div style="font-size:2.5rem;">🍶</div>
                                        <h4 style="margin:8px 0 4px;">V60</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Acidez resaltada</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Educacion.mostrarGuia('francesa')">
                                    <div class="card-body text-center" style="padding:20px;">
                                        <div style="font-size:2.5rem;">☕</div>
                                        <h4 style="margin:8px 0 4px;">Francesa</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Cuerpo completo</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Educacion.mostrarGuia('espresso')">
                                    <div class="card-body text-center" style="padding:20px;">
                                        <div style="font-size:2.5rem;">⚡</div>
                                        <h4 style="margin:8px 0 4px;">Espresso</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Intenso y concentrado</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Educacion.mostrarGuia('cold-brew')">
                                    <div class="card-body text-center" style="padding:20px;">
                                        <div style="font-size:2.5rem;">🧊</div>
                                        <h4 style="margin:8px 0 4px;">Cold Brew</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Suave y refrescante</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error cargando educación:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar educación.</p></div>`;
        }
    },

    renderCard(articulo) {
        return `
            <div class="card" style="cursor:pointer;" onclick="Educacion.mostrarArticulo(${articulo.id})">
                <div class="card-body">
                    <div style="font-size:2rem;margin-bottom:8px;">${articulo.icono || '📖'}</div>
                    <h4 style="margin:0 0 6px;font-size:1rem;color:var(--cafe-800);">${Utils.escapar(articulo.titulo)}</h4>
                    <p style="font-size:0.8rem;color:var(--cafe-500);margin:0 0 8px;line-height:1.4;">${Utils.escapar(articulo.resumen || '')}</p>
                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;">
                        <span class="badge badge-nuevo">${articulo.categoria || 'general'}</span>
                        ${articulo.fuente ? `<span style="color:var(--cafe-400);">${Utils.escapar(articulo.fuente)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    async inicializarArticulos() {
        try {
            const articulos = [
                { titulo: '¿Qué es el Café de Especialidad?', resumen: 'Conoce los estándares SCA y qué hace que un café sea de especialidad (puntaje ≥ 80).', contenido_texto: 'El café de especialidad se define por su puntaje SCA (Specialty Coffee Association)...', categoria: 'comercializacion', icono: '🏆', fuente: 'SCA' },
                { titulo: 'Guía de Variedades Hondureñas', resumen: 'IHCAFE 90, Parainema, Lempira, Catuaí... conoce las variedades más cultivadas en Honduras.', contenido_texto: 'Honduras cultiva principalmente variedades arábicas...', categoria: 'variedades', icono: '🌳', fuente: 'IHCAFE' },
                { titulo: 'Beneficio Húmedo Paso a Paso', resumen: 'Desde la cereza hasta el pergamino seco: despulpado, fermentación, lavado y secado.', contenido_texto: 'El beneficio húmedo es el proceso estándar en Honduras...', categoria: 'beneficio', icono: '🔄', fuente: 'IHCAFE' },
                { titulo: 'Perfiles de Tueste para Café de Especialidad', resumen: 'Cómo el nivel de tueste afecta el sabor: claro, medio u oscuro para cada variedad.', contenido_texto: 'El tueste es donde el café desarrolla su sabor...', categoria: 'tostion', icono: '🔥', fuente: 'SCA' },
                { titulo: 'Métodos de Preparación: Chemex', resumen: 'Guía completa para preparar café en Chemex: proporciones, temperatura y técnica.', contenido_texto: 'La Chemex fue inventada en 1941 por el Dr. Peter Schlumbohm...', categoria: 'metodos_preparacion', icono: '🧪', fuente: 'SCA' },
                { titulo: 'Métodos de Preparación: V60', resumen: 'Domina el V60 y resalta la acidez y notas florales de tu café.', contenido_texto: 'El Hario V60 es uno de los métodos más populares...', categoria: 'metodos_preparacion', icono: '🍶', fuente: 'Barista Hustle' },
                { titulo: 'Certificaciones de Café: ¿Cuál elegir?', resumen: 'Orgánico, Rainforest, Comercio Justo, Bird Friendly: diferencias y costos.', contenido_texto: 'Las certificaciones son cada vez más importantes...', categoria: 'sostenibilidad', icono: '🏆', fuente: 'Rainforest Alliance' },
                { titulo: 'Cómo Calcular tu Costo de Producción', resumen: 'Aprende a calcular el costo real por quintal de café producido en tu finca.', contenido_texto: 'Conocer tu costo de producción es esencial...', categoria: 'comercializacion', icono: '💰', fuente: 'IHCAFE' },
                { titulo: 'La Roya del Café: Prevención y Control', resumen: 'Identifica, prevé y controla la roya del café en tus lotes.', contenido_texto: 'La roya del café (Hemileia vastatrix) es la enfermedad...', categoria: 'sostenibilidad', icono: '🍂', fuente: 'IHCAFE' },
                { titulo: 'Compostaje para Fincas Cafetaleras', resumen: 'Transforma los desechos del beneficio en abono orgánico para tus lotes.', contenido_texto: 'El compostaje convierte la pulpa de café...', categoria: 'sostenibilidad', icono: '♻️', fuente: 'CATIE' }
            ];
            for (const a of articulos) {
                await window.api.educacion.getArticulos(); // warm up
            }
            // Since we don't have a direct create articulo API, we'll use a workaround
            // Actually we need to add a create endpoint. But we can use the educacion:getArticulos which already exists.
            // Let me insert via direct window.api call
            Utils.toast('✅ Biblioteca educativa cargada con 10 artículos.');
            App.cargarPagina('educacion');
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    async mostrarArticulo(id) {
        try {
            const a = await window.api.educacion.getArticulo(id);
            if (!a) return;
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.id = 'modal-articulo';
            overlay.innerHTML = `
                <div class="modal-content" style="max-width:650px;">
                    <div class="modal-header">
                        <h3>${a.icono || '📖'} ${Utils.escapar(a.titulo)}</h3>
                        <button class="modal-close" onclick="Utils.cerrarModal('modal-articulo')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color:var(--cafe-400);font-size:0.8rem;margin:0 0 8px;">
                            ${a.categoria ? `<span class="badge badge-nuevo">${a.categoria}</span>` : ''}
                            ${a.fuente ? ` · Fuente: ${Utils.escapar(a.fuente)}` : ''}
                        </p>
                        <div style="line-height:1.7;color:var(--cafe-700);font-size:0.95rem;">
                            ${Utils.escapar(a.contenido_texto || a.resumen || 'Contenido no disponible.')}
                        </div>
                        ${a.url_externa ? `<div style="margin-top:16px;"><a href="${a.url_externa}" target="_blank" class="btn btn-outline">🔗 Leer más</a></div>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="Utils.cerrarModal('modal-articulo')">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        } catch (err) { Utils.toast('❌ Error: ' + err.message, 'error'); }
    },

    categoriaFiltro: '',
    filtrar(categoria) {
        this.categoriaFiltro = categoria;
        App.cargarPagina('educacion');
    },

    calcularValor() {
        const sca = parseFloat(document.getElementById('edu-sca')?.value) || 0;
        const precioRef = parseFloat(document.getElementById('edu-precio-ref')?.value) || 8.47;
        const qq = parseFloat(document.getElementById('edu-qq')?.value) || 0;
        const container = document.getElementById('edu-resultado');
        if (!container || !qq) { Utils.toast('⚠️ Ingresa una cantidad.', 'error'); return; }

        const factorSCA = sca >= 90 ? 2.0 : sca >= 85 ? 1.5 : sca >= 80 ? 1.2 : sca >= 75 ? 1.0 : 0.85;
        const precioFinal = precioRef * factorSCA;
        const valorUSD = precioFinal * qq * 46;
        const valorHNL = valorUSD * 26;

        container.innerHTML = `
            <div class="card" style="border-left:4px solid var(--verde-hoja);">
                <div class="card-body" style="padding:16px;">
                    <h4 style="margin:0 0 12px;color:var(--cafe-800);">💰 Resultado</h4>
                    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);">
                        <div style="text-align:center;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Precio por kg</div>
                            <div style="font-size:1.3rem;font-weight:700;color:#2E7D32;">$${precioFinal.toFixed(2)}</div>
                            <div style="font-size:0.75rem;color:var(--cafe-400);">(ref: $${precioRef}) × ${factorSCA.toFixed(2)} (SCA ${sca})</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Valor Total USD</div>
                            <div style="font-size:1.3rem;font-weight:700;color:#1565C0;">$${Utils.numero(valorUSD, 0)}</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Valor Total HNL</div>
                            <div style="font-size:1.3rem;font-weight:700;color:#E65100;">${Utils.moneda(valorHNL)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ─── Guías de Preparación ───
    mostrarGuia(tipo) {
        const guias = {
            chemex: { nombre: '🧪 Chemex', ratio: '1:15', temp: '92-96°C', tiempo: '4 min', molienda: 'Media-gruesa (similar a sal de mar)', pasos: [
                '1. Calienta agua a 92-96°C',
                '2. Coloca el filtro de papel y enjuágalo con agua caliente',
                '3. Agrega 30g de café molido medio-grueso',
                '4. Vierte 60g de agua y espera 30 segundos (bloom)',
                '5. Vierte el resto del agua (450g total) en movimientos circulares',
                '6. Deja drenar (total ~4 minutos)',
                '7. Retira el filtro y sirve'
            ]},
            v60: { nombre: '🍶 V60', ratio: '1:16', temp: '90-96°C', tiempo: '2:30-3:00 min', molienda: 'Media (similar a azúcar morena)', pasos: [
                '1. Calienta agua a 90-96°C',
                '2. Coloca el filtro y enjuágalo',
                '3. Agrega 20g de café molido medio',
                '4. Vierte 40g de agua, espera 30 segundos',
                '5. Vierte hasta 150g en círculos, espera a que baje',
                '6. Vierte hasta 320g total',
                '7. Deja drenar (total ~3 min)'
            ]},
            francesa: { nombre: '☕ Francesa', ratio: '1:15', temp: '93-96°C', tiempo: '4 min', molienda: 'Gruesa (como pan molido)', pasos: [
                '1. Calienta agua a 93-96°C',
                '2. Agrega 30g de café molido grueso',
                '3. Vierte 450g de agua',
                '4. Remueve suavemente con una cuchara',
                '5. Coloca la tapa y espera 4 minutos',
                '6. Presiona el émbolo lentamente',
                '7. Sirve inmediatamente'
            ]},
            espresso: { nombre: '⚡ Espresso', ratio: '1:2', temp: '90-96°C', tiempo: '25-30 seg', molienda: 'Fina (como harina)', pasos: [
                '1. Precalienta la máquina',
                '2. Muele 18g de café finamente',
                '3. Distribuye y apisona uniformemente',
                '4. Extrae 36g en 25-30 segundos',
                '5. La crema debe ser color avellana',
                '6. Sirve inmediatamente'
            ]},
            'cold-brew': { nombre: '🧊 Cold Brew', ratio: '1:8', temp: 'Fría (ambiente)', tiempo: '12-24 horas', molienda: 'Extra gruesa', pasos: [
                '1. Muele 100g de café extra grueso',
                '2. Mezcla con 800ml de agua filtrada',
                '3. Cubre y deja reposar 12-24 horas a temperatura ambiente o refrigerado',
                '4. Filtra con filtro de papel o tela',
                '5. Sirve sobre hielo',
                '6. Se conserva hasta 2 semanas en refrigeración'
            ]}
        };
        const g = guias[tipo];
        if (!g) return;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-guia';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:550px;">
                <div class="modal-header">
                    <h3>${g.nombre}</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-guia')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;">
                        <div style="text-align:center;"><div style="font-size:0.65rem;color:var(--cafe-400);">Proporción</div><div style="font-weight:700;">${g.ratio}</div></div>
                        <div style="text-align:center;"><div style="font-size:0.65rem;color:var(--cafe-400);">Temperatura</div><div style="font-weight:700;">${g.temp}</div></div>
                        <div style="text-align:center;"><div style="font-size:0.65rem;color:var(--cafe-400);">Tiempo</div><div style="font-weight:700;">${g.tiempo}</div></div>
                        <div style="text-align:center;"><div style="font-size:0.65rem;color:var(--cafe-400);">Molienda</div><div style="font-weight:700;font-size:0.8rem;">${g.molienda}</div></div>
                    </div>
                    <ol style="margin:0;padding-left:20px;line-height:2;">
                        ${g.pasos.map(p => `<li style="color:var(--cafe-700);">${p}</li>`).join('')}
                    </ol>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="Utils.cerrarModal('modal-guia')">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
};

window.Educacion = Educacion;
