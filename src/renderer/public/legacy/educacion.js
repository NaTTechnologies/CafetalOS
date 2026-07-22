// ─── Cafetal OS — Centro de aprendizaje cafetalero interactivo ───

const Educacion = {
    categoriaFiltro: '',
    busqueda: '',
    articulos: [],
    progreso: [],
    container: null,

    categorias: {
        sostenibilidad: { label: 'Sostenibilidad', icon: '🌱' },
        variedades: { label: 'Variedades', icon: '🌳' },
        beneficio: { label: 'Beneficio', icon: '🔄' },
        comercializacion: { label: 'Comercialización', icon: '📈' },
        tostion: { label: 'Tostión', icon: '🔥' },
        metodos_preparacion: { label: 'Preparación', icon: '☕' }
    },

    rutas: [
        { id: 'produccion', icon: '🌿', titulo: 'De la finca a la cosecha', categorias: ['variedades', 'sostenibilidad'], descripcion: 'Variedades, manejo del cultivo, prevención y prácticas regenerativas.' },
        { id: 'calidad', icon: '🧪', titulo: 'Del fruto a la calidad', categorias: ['beneficio', 'tostion'], descripcion: 'Beneficio, secado, humedad, rendimiento y transformación del café.' },
        { id: 'negocio', icon: '🤝', titulo: 'Del inventario al mercado', categorias: ['comercializacion', 'metodos_preparacion'], descripcion: 'Costos, compras, ventas, valor de taza y comunicación con clientes.' }
    ],

    contenidoExtra: {
        beneficio: {
            objetivos: ['Distinguir las etapas del beneficio.', 'Registrar variables que afectan el rendimiento.', 'Reconocer señales de riesgo en fermentación y secado.'],
            checklist: ['Pesar el café recibido.', 'Registrar hora de despulpado.', 'Controlar fermentación por lote.', 'Medir humedad antes de almacenar.'],
            quiz: { pregunta: '¿Qué dato permite comparar la eficiencia entre la cereza recibida y el pergamino obtenido?', opciones: ['La altitud de la finca', 'El rendimiento de conversión', 'El número de cortadores'], correcta: 1 }
        },
        comercializacion: {
            objetivos: ['Diferenciar precio, costo y margen.', 'Registrar compras por peso y estado físico.', 'Documentar origen y calidad del lote.'],
            checklist: ['Confirmar peso neto.', 'Identificar proveedor y origen.', 'Evaluar humedad y defectos.', 'Calcular costo total y costo por kg.'],
            quiz: { pregunta: 'Al recibir café comprado, ¿qué conjunto ofrece mayor trazabilidad?', opciones: ['Nombre informal y total pagado', 'Proveedor, peso, estado, calidad y fecha', 'Solo el número de sacos'], correcta: 1 }
        },
        sostenibilidad: {
            objetivos: ['Relacionar prácticas de campo con riesgos.', 'Documentar acciones ambientales.', 'Convertir observaciones en planes de seguimiento.'],
            checklist: ['Identificar el lote.', 'Registrar evidencia.', 'Asignar responsable.', 'Definir fecha de revisión.'],
            quiz: { pregunta: '¿Qué registro vuelve accionable una observación de campo?', opciones: ['Una nota sin fecha', 'Responsable, evidencia y seguimiento', 'Solo una fotografía'], correcta: 1 }
        },
        variedades: {
            objetivos: ['Reconocer atributos agronómicos.', 'Relacionar variedad y lote.', 'Usar información varietal para planificar.'],
            checklist: ['Confirmar variedad.', 'Registrar año de siembra.', 'Documentar altitud y suelo.', 'Revisar comportamiento productivo.'],
            quiz: { pregunta: '¿Dónde debe quedar vinculada la variedad para analizar su desempeño?', opciones: ['En el lote', 'Solo en una nota general', 'En el nombre del usuario'], correcta: 0 }
        },
        tostion: {
            objetivos: ['Entender el propósito del perfil.', 'Relacionar materia prima y resultado.', 'Documentar pruebas repetibles.'],
            checklist: ['Identificar lote de origen.', 'Registrar peso inicial.', 'Anotar tiempo y temperatura.', 'Guardar resultado sensorial.'],
            quiz: { pregunta: '¿Qué hace reproducible una prueba de tueste?', opciones: ['Recordar el color', 'Registrar variables y lote', 'Cambiar varios factores a la vez'], correcta: 1 }
        },
        metodos_preparacion: {
            objetivos: ['Controlar proporción, molienda y temperatura.', 'Comparar resultados.', 'Comunicar el perfil de taza.'],
            checklist: ['Pesar café y agua.', 'Registrar molienda.', 'Controlar tiempo.', 'Anotar percepción sensorial.'],
            quiz: { pregunta: '¿Qué práctica facilita comparar dos preparaciones?', opciones: ['Medir las variables', 'Usar cantidades aproximadas', 'Cambiar método y café al mismo tiempo'], correcta: 0 }
        }
    },

    async cargar(container) {
        this.container = container;
        try {
            const [articulos, progreso] = await Promise.all([
                window.api.educacion.getArticulos(),
                window.api.educacion.getProgress().catch(() => [])
            ]);
            this.articulos = articulos || [];
            this.progreso = progreso || [];
            this.render();
        } catch (error) {
            console.error('Error cargando educación:', error);
            container.innerHTML = `<div class="page-body"><div class="module-error">No se pudo cargar el centro educativo: ${Utils.escapar(error.message)}</div></div>`;
        }
    },

    progressFor(id) {
        return this.progreso.find(item => Number(item.articulo_id) === Number(id)) || { progreso_porcentaje: 0, estado: 'pendiente' };
    },

    get filtered() {
        const term = this.busqueda.trim().toLowerCase();
        return this.articulos.filter(article => {
            const categoryMatch = !this.categoriaFiltro || article.categoria === this.categoriaFiltro;
            const text = `${article.titulo || ''} ${article.resumen || ''} ${article.fuente || ''}`.toLowerCase();
            return categoryMatch && (!term || text.includes(term));
        });
    },

    summary() {
        const total = this.articulos.length || 1;
        const completed = this.progreso.filter(item => item.estado === 'completado' || Number(item.progreso_porcentaje) >= 100).length;
        const started = this.progreso.filter(item => Number(item.progreso_porcentaje) > 0).length;
        return { completed, started, percent: Math.round((completed / total) * 100) };
    },

    render() {
        if (!this.container) return;
        const stats = this.summary();
        const cards = this.filtered.map(article => this.renderCard(article)).join('');
        this.container.innerHTML = `
            <div class="page-header">
                <div><h2>📚 Educación Cafetalera</h2><p class="page-subtitle">Aprendizaje práctico conectado con la operación de la finca, el beneficio y la comercialización.</p></div>
            </div>
            <div class="page-body education-shell">
                <section class="education-hero">
                    <div>
                        <span class="badge badge-nuevo">Centro de aprendizaje</span>
                        <h3>Aprender, aplicar y dejar evidencia</h3>
                        <p>Abra una lección, revise objetivos, complete la lista de aplicación y responda una evaluación corta. El avance se conserva por usuario.</p>
                    </div>
                    <div class="education-progress-ring" style="--edu-progress:${stats.percent}%"><span>${stats.percent}%<small>${stats.completed}/${this.articulos.length} completadas</small></span></div>
                </section>

                <section>
                    <div class="education-section-title"><h3>Rutas sugeridas</h3><small>${stats.started} lecciones iniciadas</small></div>
                    <div class="learning-paths">${this.rutas.map(route => this.renderRoute(route)).join('')}</div>
                </section>

                <section class="education-controls">
                    <input class="education-search" type="search" placeholder="Buscar tema, fuente o palabra clave…" value="${Utils.escapar(this.busqueda)}" oninput="Educacion.buscar(this.value)" aria-label="Buscar contenido educativo">
                    <div class="education-filters">
                        <button class="btn btn-sm ${!this.categoriaFiltro ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('')">Todos</button>
                        ${Object.entries(this.categorias).map(([key, value]) => `<button class="btn btn-sm ${this.categoriaFiltro === key ? 'btn-primary' : 'btn-outline'}" onclick="Educacion.filtrar('${key}')">${value.icon} ${value.label}</button>`).join('')}
                    </div>
                </section>

                <section>
                    <div class="education-section-title"><h3>Biblioteca práctica</h3><small>${this.filtered.length} contenidos</small></div>
                    <div class="education-grid">${cards || '<div class="education-empty">No se encontraron contenidos con estos filtros.</div>'}</div>
                </section>
            </div>`;
    },

    renderRoute(route) {
        const articles = this.articulos.filter(article => route.categorias.includes(article.categoria));
        const completed = articles.filter(article => this.progressFor(article.id).estado === 'completado').length;
        const percent = articles.length ? Math.round((completed / articles.length) * 100) : 0;
        return `<article class="learning-path" onclick="Educacion.abrirRuta('${route.id}')">
            <div style="font-size:1.8rem">${route.icon}</div><h4>${route.titulo}</h4><p>${route.descripcion}</p>
            <div class="learning-progress"><span style="width:${percent}%"></span></div><footer><span>${articles.length} lecciones</span><strong>${percent}%</strong></footer>
        </article>`;
    },

    renderCard(article) {
        const progress = this.progressFor(article.id);
        const completed = progress.estado === 'completado' || Number(progress.progreso_porcentaje) >= 100;
        const category = this.categorias[article.categoria] || { label: article.categoria || 'General', icon: '📖' };
        return `<article class="education-card ${completed ? 'completed' : ''}" onclick="Educacion.mostrarArticulo(${article.id})" tabindex="0" role="button" onkeydown="if(event.key==='Enter') Educacion.mostrarArticulo(${article.id})">
            <div class="education-card-icon">${article.icono || category.icon}</div>
            <h4>${Utils.escapar(article.titulo)}</h4><p>${Utils.escapar(article.resumen || '')}</p>
            <div class="learning-progress"><span style="width:${Number(progress.progreso_porcentaje || 0)}%"></span></div>
            <footer><span class="badge badge-nuevo">${category.label}</span>${completed ? '<span class="complete-mark">✓ Completada</span>' : `<span>${Number(progress.progreso_porcentaje || 0)}%</span>`}</footer>
        </article>`;
    },

    buscar(value) { this.busqueda = value || ''; this.render(); },
    filtrar(category) { this.categoriaFiltro = category; this.render(); },
    abrirRuta(id) {
        const route = this.rutas.find(item => item.id === id);
        this.categoriaFiltro = route?.categorias?.[0] || '';
        this.busqueda = '';
        this.render();
        document.querySelector('.education-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    articleSections(article) {
        const text = String(article.contenido_texto || article.resumen || 'Contenido pendiente de ampliar.');
        const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
        const middle = Math.max(1, Math.ceil(sentences.length / 2));
        return [sentences.slice(0, middle).join(' '), sentences.slice(middle).join(' ')].filter(Boolean);
    },

    async mostrarArticulo(id) {
        try {
            const article = await window.api.educacion.getArticulo(id);
            if (!article) return;
            const extra = this.contenidoExtra[article.categoria] || this.contenidoExtra.comercializacion;
            const progress = this.progressFor(id);
            const sections = this.articleSections(article);
            await window.api.educacion.saveProgress({ articulo_id: id, progreso_porcentaje: Math.max(25, Number(progress.progreso_porcentaje || 0)), estado: 'iniciado' });
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay active';
            overlay.id = 'modal-articulo';
            overlay.innerHTML = `
                <div class="modal-content article-modal-content">
                    <div class="modal-header"><div><h3>${article.icono || '📖'} ${Utils.escapar(article.titulo)}</h3><small>${Utils.escapar(article.fuente || 'Biblioteca Cafetal OS')}</small></div><button class="modal-close" aria-label="Cerrar lección" onclick="Educacion.cerrarArticulo()">&times;</button></div>
                    <div class="modal-body">
                        <div class="article-layout">
                            <article class="article-content">
                                <p><strong>${Utils.escapar(article.resumen || '')}</strong></p>
                                <h4>1. Contexto</h4><p>${Utils.escapar(sections[0] || '')}</p>
                                <h4>2. Aplicación en Cafetal OS</h4><p>${Utils.escapar(sections[1] || 'Conecte este conocimiento con los registros del módulo correspondiente y compare resultados por lote, temporada o proveedor.')}</p>
                                <h4>3. Decisión práctica</h4><p>No registre información solo para archivar. Utilice el dato para decidir qué corregir, qué repetir y qué evidencia conservar para la siguiente temporada.</p>
                                <div class="article-box"><h4>Objetivos de aprendizaje</h4><ul>${extra.objetivos.map(item => `<li>${item}</li>`).join('')}</ul></div>
                            </article>
                            <aside class="article-sidebar">
                                <div class="article-box"><h4>Lista de aplicación</h4><div class="article-checklist">${extra.checklist.map((item, index) => `<label><input type="checkbox" data-edu-check="${index}" onchange="Educacion.actualizarProgreso(${id})"> ${item}</label>`).join('')}</div></div>
                                <div class="article-box"><h4>Pregunta rápida</h4><p>${extra.quiz.pregunta}</p><div class="quiz-options">${extra.quiz.opciones.map((option, index) => `<button class="quiz-option" onclick="Educacion.responderQuiz(${id},${index},${extra.quiz.correcta},this)">${option}</button>`).join('')}</div><small id="edu-quiz-result"></small></div>
                                <div class="article-box"><h4>Avance guardado</h4><div class="learning-progress"><span id="article-progress-bar" style="width:${Number(progress.progreso_porcentaje || 25)}%"></span></div><p id="article-progress-label">${Number(progress.progreso_porcentaje || 25)}% completado</p></div>
                            </aside>
                        </div>
                    </div>
                    <div class="modal-footer"><button class="btn btn-outline" onclick="Educacion.cerrarArticulo()">Continuar luego</button><button class="btn btn-primary" onclick="Educacion.completarArticulo(${id})">✓ Marcar como completada</button></div>
                </div>`;
            document.body.appendChild(overlay);
            document.addEventListener('keydown', this.escapeHandler);
        } catch (error) { Utils.toast(`❌ ${error.message}`, 'error'); }
    },

    escapeHandler(event) { if (event.key === 'Escape') Educacion.cerrarArticulo(); },
    cerrarArticulo() {
        document.getElementById('modal-articulo')?.remove();
        document.removeEventListener('keydown', this.escapeHandler);
        this.cargar(this.container);
    },

    async actualizarProgreso(id) {
        const boxes = [...document.querySelectorAll('[data-edu-check]')];
        const checked = boxes.filter(box => box.checked).length;
        const percent = Math.min(90, 25 + Math.round((checked / Math.max(1, boxes.length)) * 55));
        await window.api.educacion.saveProgress({ articulo_id: id, progreso_porcentaje: percent, estado: 'iniciado' });
        const bar = document.getElementById('article-progress-bar');
        const label = document.getElementById('article-progress-label');
        if (bar) bar.style.width = `${percent}%`;
        if (label) label.textContent = `${percent}% completado`;
    },

    async responderQuiz(articleId, answer, correct, button) {
        const options = [...button.parentElement.querySelectorAll('.quiz-option')];
        options.forEach((option, index) => {
            option.disabled = true;
            if (index === correct) option.classList.add('correct');
            else if (index === answer) option.classList.add('incorrect');
        });
        const passed = answer === correct;
        const result = document.getElementById('edu-quiz-result');
        if (result) result.textContent = passed ? '✅ Correcto. Ya puede relacionar el concepto con la operación.' : 'Revise la respuesta señalada y vuelva a aplicar el concepto en un caso real.';
        await window.api.educacion.saveQuiz({ articulo_id: articleId, puntaje: passed ? 1 : 0, total: 1, respuestas: { respuesta: answer, correcta: correct } });
        if (passed) await window.api.educacion.saveProgress({ articulo_id: articleId, progreso_porcentaje: 90, estado: 'iniciado' });
    },

    async completarArticulo(id) {
        await window.api.educacion.saveProgress({ articulo_id: id, progreso_porcentaje: 100, estado: 'completado' });
        Utils.toast('✅ Lección completada y guardada en tu avance.');
        this.cerrarArticulo();
    }
};

window.Educacion = Educacion;
