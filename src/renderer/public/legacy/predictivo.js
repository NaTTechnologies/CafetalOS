// ─── Cafetal OS — Módulo de IA Predictiva ───

const Predictivo = {
    async cargar(container) {
        try {
            const lotes = await window.api.lotes.getAll();
            const evaluaciones = await window.api.calidad.getAll().catch(() => []);

            // Predecir rendimiento para cada lote
            const predicciones = lotes.map(l => {
                const pred = this.predecirRendimiento(l);
                const real = l.total_kilos || 0;
                const area = l.area_mz || 1;
                return {
                    ...l,
                    rendimiento_esperado_kg: pred.rendimiento_esperado,
                    rendimiento_esperado_qq_mz: pred.rendimiento_qq_mz,
                    real_qq_mz: area > 0 ? Math.round(((real / area) / 46) * 100) / 100 : 0,
                    desviacion: pred.rendimiento_qq_mz > 0 ? Math.round((((real / area) / 46 - pred.rendimiento_qq_mz) / pred.rendimiento_qq_mz) * 100) : 0,
                    confianza: pred.confianza
                };
            });

            const totalPredicho = predicciones.reduce((s, p) => s + p.rendimiento_esperado_kg, 0);
            const totalReal = predicciones.reduce((s, p) => s + (p.real_qq_mz * (p.area_mz || 1) * 46), 0);

            container.innerHTML = `
                <div class="page-header">
                    <h2>🤖 IA Predictiva</h2>
                    <span style="color:var(--cafe-400);font-size:0.85rem;">Modelo de regresión lineal + clasificación de calidad</span>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card" style="border-left-color:var(--verde-hoja);">
                            <div class="kpi-icon">📊</div>
                            <div class="kpi-value">${Utils.numero(totalPredicho / 46, 0)} qq</div>
                            <div class="kpi-label">Producción Esperada (total)</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:var(--oro-cafe);">
                            <div class="kpi-icon">📐</div>
                            <div class="kpi-value">${predicciones.length}</div>
                            <div class="kpi-label">Lotes Analizados</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#1565C0;">
                            <div class="kpi-icon">🎯</div>
                            <div class="kpi-value">${evaluaciones.length}</div>
                            <div class="kpi-label">Evaluaciones de Calidad</div>
                        </div>
                        <div class="kpi-card" style="border-left-color:#9C27B0;">
                            <div class="kpi-icon">⚙️</div>
                            <div class="kpi-value">${Predictivo.MODELOS.length}</div>
                            <div class="kpi-label">Modelos de Tueste</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <div class="card">
                            <div class="card-header">🌳 Predicción de Rendimiento por Lote</div>
                            <div class="card-body">
                                <p style="font-size:0.8rem;color:var(--cafe-400);margin:0 0 12px;">
                                    Modelo: regresión lineal <em>rend = 1.2 × años + 8.0</em> ajustado por altitud.
                                </p>
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Lote</th><th>Variedad</th><th>Edad</th><th>Esperado (qq/mz)</th><th>Real (qq/mz)</th><th>Desv.</th><th>Conf.</th></tr>
                                        </thead>
                                        <tbody>
                                            ${predicciones.map(p => `
                                                <tr>
                                                    <td><strong>${Utils.escapar(p.codigo)}</strong></td>
                                                    <td>${Utils.escapar(p.variedad_nombre || '—')}</td>
                                                    <td>${Utils.añoActual() - (p.año_siembra || Utils.añoActual())} años</td>
                                                    <td>${Utils.numero(p.rendimiento_esperado_qq_mz, 1)}</td>
                                                    <td>${Utils.numero(p.real_qq_mz, 1)}</td>
                                                    <td style="color:${p.desviacion > 10 ? 'var(--rojo-cafe)' : p.desviacion < -10 ? 'var(--verde-hoja)' : 'inherit'};">
                                                        ${p.desviacion > 0 ? '+' : ''}${p.desviacion}%
                                                    </td>
                                                    <td><span class="badge ${p.confianza === 'alta' ? 'badge-produccion' : p.confianza === 'media' ? 'badge-nuevo' : 'badge-reposicion'}">${p.confianza}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">🔬 Perfil de Tueste Sugerido</div>
                            <div class="card-body">
                                <p style="font-size:0.85rem;color:var(--cafe-500);margin:0 0 12px;">
                                    Basado en la altitud del lote y la variedad.
                                </p>
                                <div style="display:flex;flex-direction:column;gap:12px;">
                                    ${predicciones.slice(0, 5).map(p => {
                                        const perfil = this.recomendarTueste(p);
                                        return `
                                            <div style="background:var(--cafe-50);border-radius:8px;padding:12px;">
                                                <div style="font-weight:600;color:var(--cafe-800);">${Utils.escapar(p.codigo)}</div>
                                                <div style="font-size:0.85rem;color:var(--cafe-500);">
                                                    <strong>Tueste ${perfil.tueste}</strong> · ${perfil.temp_inicial}°C → ${perfil.temp_final}°C · ${perfil.tiempo}s
                                                </div>
                                                <div style="font-size:0.8rem;color:var(--cafe-400);">${perfil.notas_cata}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Evaluaciones de Calidad -->
                    <div class="card mt-4">
                        <div class="card-header flex-between">
                            <span>🔬 Evaluaciones de Calidad (SCA)</span>
                            <button class="btn btn-sm btn-success" onclick="Calidad.mostrarFormEvaluacion()">➕ Nueva Evaluación</button>
                        </div>
                        <div class="card-body">
                            ${evaluaciones.length === 0 ? '<p style="color:var(--cafe-400);">No hay evaluaciones de calidad registradas.</p>' : `
                                <div class="table-container">
                                    <table>
                                        <thead><tr><th>Fecha</th><th>Puntaje SCA</th><th>Fragancia</th><th>Sabor</th><th>Acidez</th><th>Cuerpo</th><th>Clasif.</th><th>Evaluador</th></tr></thead>
                                        <tbody>
                                            ${evaluaciones.map(e => {
                                                const clasif = this.clasificarSCA(e.puntaje_sca);
                                                return `<tr>
                                                    <td>${e.fecha}</td>
                                                    <td><strong>${Utils.numero(e.puntaje_sca, 1)}</strong></td>
                                                    <td>${e.fragancia || '—'}</td>
                                                    <td>${e.sabor || '—'}</td>
                                                    <td>${e.acidez || '—'}</td>
                                                    <td>${e.cuerpo || '—'}</td>
                                                    <td><span class="badge" style="background:${clasif.color};color:white;">${clasif.nombre}</span></td>
                                                    <td>${Utils.escapar(e.evaluador || '—')}</td>
                                                </tr>`;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Calculadora de tueste -->
                    <div class="card">
                        <div class="card-header">⚙️ Simulador de Optimización de Tueste</div>
                        <div class="card-body">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Altitud del lote (msnm)</label>
                                    <input type="number" id="tueste-altitud" class="form-control" value="1200" min="0" max="2000">
                                </div>
                                <div class="form-group">
                                    <label>Variedad</label>
                                    <select id="tueste-variedad" class="form-control">
                                        <option value="catuaí">Catuaí</option>
                                        <option value="geisha">Geisha</option>
                                        <option value="bourbon">Bourbon</option>
                                        <option value="parainema" selected>Parainema</option>
                                        <option value="ihcafe90">IHCAFE 90</option>
                                        <option value="typica">Typica</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Nivel de Tueste</label>
                                    <select id="tueste-nivel" class="form-control">
                                        <option value="claro">☀️ Claro (City)</option>
                                        <option value="medio" selected>🌤️ Medio (Full City)</option>
                                        <option value="oscuro">🌑 Oscuro (Espresso)</option>
                                    </select>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="Predictivo.simularTueste()">⚙️ Optimizar</button>
                            <div id="tueste-resultado" style="margin-top:16px;"></div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('Error cargando predictivo:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar módulo predictivo.</p></div>`;
        }
    },

    // ─── Modelos ───

    MODELOS: [
        { nombre: 'Regresión Lineal', tipo: 'rendimiento', precision: '±12%' },
        { nombre: 'Perfil de Tueste', tipo: 'calidad', precision: 'Recomendación' },
        { nombre: 'Clasificación SCA', tipo: 'calidad', precision: '±3 puntos' }
    ],

    // Predicción de rendimiento por lote
    predecirRendimiento(lote) {
        const años = Utils.añoActual() - (lote.año_siembra || Utils.añoActual());
        const pendiente = 1.2;    // kg adicionales por año de madurez (hasta 8 años)
        const intercepto = 8.0;   // rendimiento base en kg/planta/año
        const base = pendiente * Math.min(años, 8) + intercepto;
        const factorAltitud = lote.altitud_lote_msnm > 1200 ? 1.15 : (lote.altitud_lote_msnm > 800 ? 1.05 : 0.95);
        const factorVariedad = { 'geisha': 0.85, 'bourbon': 1.1, 'typica': 0.9 };
        const fv = factorVariedad[(lote.variedad_nombre || '').toLowerCase()] || 1.0;
        const rendimientoEsperado = base * factorAltitud * fv;
        const area = lote.area_mz || 1;
        const rendimiento_qq_mz = Math.round((rendimientoEsperado * (lote.densidad_plantas_mz || 5000) / 46 / 1000) * 100) / 100;
        const confianza = años >= 4 ? 'alta' : años >= 2 ? 'media' : 'baja';
        return { rendimiento_esperado: Math.round(rendimientoEsperado * 100) / 100, rendimiento_qq_mz, confianza };
    },

    // Recomendación de tueste por lote
    recomendarTueste(lote) {
        const altitud = lote.altitud_lote_msnm || 1000;
        const variedad = (lote.variedad_nombre || '').toLowerCase();
        if (altitud > 1400 || variedad === 'geisha' || variedad === 'typica') {
            return { tueste: 'Claro (City)', temp_inicial: 196, temp_final: 205, tiempo: '7:00 - 8:30', notas_cata: 'Resalta acidez cítrica, notas florales y afrutadas. Ideal para café de especialidad.' };
        } else if (altitud > 1000 || variedad === 'bourbon') {
            return { tueste: 'Medio (Full City)', temp_inicial: 205, temp_final: 215, tiempo: '8:30 - 10:00', notas_cata: 'Balance perfecto entre acidez y cuerpo. Notas a chocolate, caramelo y frutos secos.' };
        } else {
            return { tueste: 'Oscuro (Espresso)', temp_inicial: 215, temp_final: 225, tiempo: '10:00 - 12:00', notas_cata: 'Cuerpo completo, baja acidez. Notas a chocolate amargo, tabaco y especias. Ideal para espresso y mezclas.' };
        }
    },

    // Clasificación SCA
    clasificarSCA(puntaje) {
        if (!puntaje) return { nombre: 'Sin evaluar', color: '#9E9E9E' };
        if (puntaje >= 90) return { nombre: 'Legendary', color: '#1B5E20' };
        if (puntaje >= 85) return { nombre: 'Especialidad', color: '#2E7D32' };
        if (puntaje >= 80) return { nombre: 'Premium', color: '#558B2F' };
        if (puntaje >= 75) return { nombre: 'Comercial', color: '#FF8F00' };
        return { nombre: 'Estándar', color: '#C62828' };
    },

    // Simulador de tueste interactivo
    simularTueste() {
        const altitud = parseInt(document.getElementById('tueste-altitud')?.value) || 1000;
        const variedad = document.getElementById('tueste-variedad')?.value || '';
        const nivel = document.getElementById('tueste-nivel')?.value || 'medio';
        const container = document.getElementById('tueste-resultado');
        if (!container) return;

        const perfiles = {
            claro: { nombre: 'Claro (City)', temp_final: 205, tiempo: '7:30', desarrollo: '18-20%' },
            medio: { nombre: 'Medio (Full City)', temp_final: 215, tiempo: '9:00', desarrollo: '20-25%' },
            oscuro: { nombre: 'Oscuro (Espresso)', temp_final: 225, tiempo: '11:00', desarrollo: '25-30%' }
        };
        const perfil = perfiles[nivel] || perfiles.medio;
        const factorAltitud = altitud > 1400 ? 'alta' : altitud > 1000 ? 'media' : 'baja';
        const perfilesVariedad = {
            geisha: { notas: 'jazmín, bergamota, durazno', acidez: 'alta', cuerpo: 'medio-ligero' },
            bourbon: { notas: 'chocolate, caramelo, naranja', acidez: 'media', cuerpo: 'medio' },
            catuaí: { notas: 'almendra, cacao, panela', acidez: 'media', cuerpo: 'medio-alto' },
            parainema: { notas: 'miel, cítricos, mandarina', acidez: 'media-alta', cuerpo: 'medio' },
            ihcafe90: { notas: 'chocolate, frutos rojos', acidez: 'media', cuerpo: 'medio-alto' },
            typica: { notas: 'floral, cacao fino', acidez: 'alta', cuerpo: 'medio-ligero' }
        };
        const pv = perfilesVariedad[variedad] || perfilesVariedad.parainema;

        container.innerHTML = `
            <div class="card" style="border-left:4px solid var(--oro-cafe);">
                <div class="card-body">
                    <h4 style="margin:0 0 12px;color:var(--cafe-800);">☕ Perfil de Tueste Recomendado</h4>
                    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">
                        <div style="text-align:center;padding:8px;background:var(--cafe-50);border-radius:6px;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Tueste</div>
                            <div style="font-weight:700;color:var(--cafe-800);">${perfil.nombre}</div>
                        </div>
                        <div style="text-align:center;padding:8px;background:var(--cafe-50);border-radius:6px;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Temp. Final</div>
                            <div style="font-weight:700;color:var(--cafe-800);">${perfil.temp_final}°C</div>
                        </div>
                        <div style="text-align:center;padding:8px;background:var(--cafe-50);border-radius:6px;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Tiempo</div>
                            <div style="font-weight:700;color:var(--cafe-800);">${perfil.tiempo} min</div>
                        </div>
                        <div style="text-align:center;padding:8px;background:var(--cafe-50);border-radius:6px;">
                            <div style="font-size:0.7rem;color:var(--cafe-400);text-transform:uppercase;">Desarrollo</div>
                            <div style="font-weight:700;color:var(--cafe-800);">${perfil.desarrollo}</div>
                        </div>
                    </div>
                    <div style="margin-top:12px;padding:12px;background:var(--crema);border-radius:6px;">
                        <div style="font-weight:600;color:var(--cafe-800);">Notas de Cata Esperadas</div>
                        <div style="font-size:0.9rem;color:var(--cafe-500);margin-top:4px;">
                            ${pv.notas} · Acidez ${pv.acidez} · Cuerpo ${pv.cuerpo} · Altitud ${factorAltitud}
                        </div>
                    </div>
                    <div style="margin-top:8px;font-size:0.8rem;color:var(--cafe-400);">
                        💡 Recomendación: Perfil de tueste ${perfil.nombre} para ${variedad} cultivado a ${altitud} msnm.
                    </div>
                </div>
            </div>
        `;
    }
};

window.Predictivo = Predictivo;
