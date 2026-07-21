// ─── Cafetal OS — Módulo de Evaluación de Calidad (SCA) ───

const Calidad = {
    async cargar(container) {
        const evaluaciones = await window.api.calidad.getAll();
        const puntajes = evaluaciones.map(item => Number(item.puntaje_sca) || 0).filter(Boolean);
        const promedio = puntajes.length ? puntajes.reduce((total, value) => total + value, 0) / puntajes.length : 0;
        const mejor = puntajes.length ? Math.max(...puntajes) : 0;
        const lotes = new Set(evaluaciones.map(item => item.lote_id).filter(Boolean)).size;
        const filas = evaluaciones.map(item => {
            const score = Number(item.puntaje_sca) || 0;
            const clasificacion = score >= 90 ? 'Excepcional' : score >= 85 ? 'Excelente' : score >= 80 ? 'Especialidad' : 'Convencional';
            return `
                <tr>
                    <td>${item.fecha || '—'}</td>
                    <td><strong>${item.lote_codigo || `Lote ${item.lote_id || '—'}`}</strong></td>
                    <td>${score.toFixed(1)}</td>
                    <td>${clasificacion}</td>
                    <td>${item.fragancia ?? '—'}</td>
                    <td>${item.sabor ?? '—'}</td>
                    <td>${item.acidez ?? '—'}</td>
                    <td>${item.cuerpo ?? '—'}</td>
                    <td>${item.evaluador || 'Sin especificar'}</td>
                    <td>${item.notas_catacion || '—'}</td>
                </tr>`;
        }).join('');

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h2>Calidad y catación</h2>
                    <p style="margin:5px 0 0;color:var(--muted)">Evaluaciones sensoriales vinculadas a lotes y procesos de beneficio.</p>
                </div>
                <button class="btn btn-success" onclick="Calidad.mostrarFormEvaluacion()">＋ Nueva evaluación</button>
            </div>
            <div class="page-body">
                <div class="kpi-grid">
                    <div class="kpi-card"><div><small>Evaluaciones</small><div class="kpi-value">${evaluaciones.length}</div></div></div>
                    <div class="kpi-card"><div><small>Promedio SCA</small><div class="kpi-value">${promedio.toFixed(1)}</div></div></div>
                    <div class="kpi-card"><div><small>Mejor puntaje</small><div class="kpi-value">${mejor.toFixed(1)}</div></div></div>
                    <div class="kpi-card"><div><small>Lotes evaluados</small><div class="kpi-value">${lotes}</div></div></div>
                </div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Fecha</th><th>Lote</th><th>SCA</th><th>Clasificación</th><th>Fragancia</th><th>Sabor</th><th>Acidez</th><th>Cuerpo</th><th>Evaluador</th><th>Notas</th></tr></thead>
                        <tbody>${filas || '<tr><td colspan="10" style="text-align:center;padding:32px">Todavía no hay evaluaciones de calidad.</td></tr>'}</tbody>
                    </table>
                </div>
                <p style="color:var(--muted);font-size:.78rem;margin-top:12px">Los puntajes son registros operativos. Una declaración formal de calidad requiere protocolo, muestra y evaluador competentes.</p>
            </div>`;
    },

    // Muestra el formulario de evaluación (llamado desde predictivo.js)
    mostrarFormEvaluacion() {
        const modal = document.getElementById('modal-calidad');
        if (modal) { modal.classList.add('active'); return; }
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'modal-calidad';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3>🔬 Evaluación de Calidad (SCA)</h3>
                    <button class="modal-close" onclick="Utils.cerrarModal('modal-calidad')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-calidad" onsubmit="return false;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Lote</label>
                                <select id="calidad-lote" class="form-control"><option value="">—</option></select>
                            </div>
                            <div class="form-group">
                                <label>Fecha</label>
                                <input type="date" id="calidad-fecha" class="form-control" value="${Utils.hoy()}">
                            </div>
                        </div>
                        <div class="form-row-4">
                            <div class="form-group">
                                <label>Fragancia / Aroma (0-10)</label>
                                <input type="number" id="calidad-fragancia" class="form-control" step="0.25" min="0" max="10" value="7.5">
                            </div>
                            <div class="form-group">
                                <label>Sabor (0-10)</label>
                                <input type="number" id="calidad-sabor" class="form-control" step="0.25" min="0" max="10" value="7.5">
                            </div>
                            <div class="form-group">
                                <label>Acidez (0-10)</label>
                                <input type="number" id="calidad-acidez" class="form-control" step="0.25" min="0" max="10" value="7.5">
                            </div>
                            <div class="form-group">
                                <label>Cuerpo (0-10)</label>
                                <input type="number" id="calidad-cuerpo" class="form-control" step="0.25" min="0" max="10" value="7.5">
                            </div>
                        </div>
                        <div class="form-row-3">
                            <div class="form-group">
                                <label>Uniformidad (0-10)</label>
                                <input type="number" id="calidad-uniformidad" class="form-control" step="0.25" min="0" max="10" value="10">
                            </div>
                            <div class="form-group">
                                <label>Taza Limpia (0-10)</label>
                                <input type="number" id="calidad-taza" class="form-control" step="0.25" min="0" max="10" value="10">
                            </div>
                            <div class="form-group">
                                <label>Dulzor (0-10)</label>
                                <input type="number" id="calidad-dulzor" class="form-control" step="0.25" min="0" max="10" value="10">
                            </div>
                        </div>
                        <div style="margin-top:8px;padding:12px;background:var(--cafe-50);border-radius:6px;text-align:center;">
                            <div style="font-size:0.8rem;color:var(--cafe-400);text-transform:uppercase;">Puntaje SCA Estimado</div>
                            <div id="calidad-puntaje-preview" style="font-size:2rem;font-weight:700;color:var(--cafe-800);">85.0</div>
                        </div>
                        <div class="form-group">
                            <label>Notas de Catación</label>
                            <textarea id="calidad-notas" class="form-control" rows="3" placeholder="Describe el perfil sensorial..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Evaluador</label>
                            <input type="text" id="calidad-evaluador" class="form-control" placeholder="Nombre del catador">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-calidad')">Cancelar</button>
                    <button class="btn btn-success" onclick="Calidad.guardarEvaluacion()">✅ Guardar Evaluación</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Cargar lotes en el select
        window.api.lotes.getAll().then(lotes => {
            const select = document.getElementById('calidad-lote');
            lotes.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id; opt.textContent = `${l.codigo} — ${l.variedad_nombre || ''}`;
                select.appendChild(opt);
            });
        });

        // Preview de puntaje en tiempo real
        ['calidad-fragancia', 'calidad-sabor', 'calidad-acidez', 'calidad-cuerpo', 'calidad-uniformidad', 'calidad-taza', 'calidad-dulzor'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => Calidad.actualizarPreview());
        });
    },

    actualizarPreview() {
        const suma = ['calidad-fragancia', 'calidad-sabor', 'calidad-acidez', 'calidad-cuerpo', 'calidad-uniformidad', 'calidad-taza', 'calidad-dulzor']
            .reduce((s, id) => s + (parseFloat(document.getElementById(id)?.value) || 0), 0);
        const preview = document.getElementById('calidad-puntaje-preview');
        if (preview) {
            preview.textContent = suma.toFixed(1);
            const clasif = Predictivo.clasificarSCA(suma);
            preview.style.color = clasif.color;
        }
    },

    async guardarEvaluacion() {
        const data = {
            lote_id: Utils.getVal('calidad-lote'),
            beneficio_id: null,
            fecha: Utils.getVal('calidad-fecha'),
            fragancia: Utils.getVal('calidad-fragancia'),
            sabor: Utils.getVal('calidad-sabor'),
            acidez: Utils.getVal('calidad-acidez'),
            cuerpo: Utils.getVal('calidad-cuerpo'),
            uniformidad: Utils.getVal('calidad-uniformidad'),
            taza_limpia: Utils.getVal('calidad-taza'),
            dulzor: Utils.getVal('calidad-dulzor'),
            notas_catacion: Utils.getVal('calidad-notas'),
            evaluador: Utils.getVal('calidad-evaluador')
        };
        if (!data.lote_id) { Utils.toast('⚠️ Selecciona un lote.', 'error'); return; }
        try {
            await window.api.calidad.create(data);
            Utils.toast(`✅ Evaluación guardada. Puntaje SCA: ${Utils.numero(data.fragancia + data.sabor + data.acidez + data.cuerpo + data.uniformidad + data.taza_limpia + data.dulzor, 1)}`);
            Utils.cerrarModal('modal-calidad');
            // Recargar la página actual
            const pagina = App.paginaActual;
            if (pagina === 'predictivo' || pagina === 'calidad') App.cargarPagina(pagina);
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    }
};

window.Calidad = Calidad;
