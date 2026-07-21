// ─── Cafetal OS — Módulo de Ayuda y Documentación ───

const Ayuda = {
    seccionActual: 'manual',

    cargar(container) {
        this.seccionActual = 'manual';
        container.innerHTML = this.renderLayout();
        this.mostrarSeccion('manual');
    },

    mostrarSeccion(id) {
        this.seccionActual = id;
        
        // Actualizar tabs
        document.querySelectorAll('.ayuda-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.seccion === id);
        });

        // Renderizar contenido
        const content = document.getElementById('ayuda-content');
        if (!content) return;

        switch(id) {
            case 'manual': content.innerHTML = this.renderManual(); break;
            case 'glosario': content.innerHTML = this.renderGlosario(); break;
            case 'flujo': content.innerHTML = this.renderFlujo(); break;
            case 'interfaces': content.innerHTML = this.renderInterfaces(); break;
            case 'faq': content.innerHTML = this.renderFAQ(); break;
            case 'atajos': content.innerHTML = this.renderAtajos(); break;
            case 'acerca': content.innerHTML = this.renderAcerca(); break;
        }

        // Scroll al inicio
        content.scrollTop = 0;
    },

    renderLayout() {
        return `
            <div class="page-header">
                <h2>❓ Ayuda y Documentación</h2>
                <span style="color:var(--cafe-400);font-size:0.85rem;">Aprende a usar Cafetal OS</span>
            </div>
            <div class="page-body" style="padding:0;">
                <div style="display:flex;height:calc(100vh - 120px);">
                    <!-- Sidebar interno de ayuda -->
                    <div style="width:200px;flex-shrink:0;background:var(--cafe-50);border-right:1px solid var(--cafe-200);padding:12px 0;overflow-y:auto;">
                        <div class="ayuda-tab active" data-seccion="manual" onclick="Ayuda.mostrarSeccion('manual')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            📖 Manual de Usuario
                        </div>
                        <div class="ayuda-tab" data-seccion="glosario" onclick="Ayuda.mostrarSeccion('glosario')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            🔬 Glosario Cafetalero
                        </div>
                        <div class="ayuda-tab" data-seccion="flujo" onclick="Ayuda.mostrarSeccion('flujo')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            🔄 Flujo del Café
                        </div>
                        <div class="ayuda-tab" data-seccion="interfaces" onclick="Ayuda.mostrarSeccion('interfaces')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            🖥️ Guía por Pantalla
                        </div>
                        <div class="ayuda-tab" data-seccion="faq" onclick="Ayuda.mostrarSeccion('faq')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            ❓ Preguntas Frecuentes
                        </div>
                        <div class="ayuda-tab" data-seccion="atajos" onclick="Ayuda.mostrarSeccion('atajos')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            ⌨️ Atajos de Teclado
                        </div>
                        <div class="ayuda-tab" data-seccion="acerca" onclick="Ayuda.mostrarSeccion('acerca')" style="padding:10px 16px;cursor:pointer;border-left:3px solid transparent;font-size:0.9rem;transition:all 0.2s;">
                            ℹ️ Acerca de
                        </div>
                    </div>
                    <!-- Contenido -->
                    <div id="ayuda-content" style="flex:1;overflow-y:auto;padding:24px;background:white;"></div>
                </div>
            </div>
        `;
    },

    // ─── Sección 1: Manual de Usuario ───
    renderManual() {
        return `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                📖 Manual de Usuario Completo
            </h2>
            <p style="color:var(--cafe-600);font-size:1rem;line-height:1.6;">
                <strong>Cafetal OS</strong> es un sistema de escritorio diseñado específicamente para el 
                caficultor hondureño. Utiliza unidades locales (manzanas, latas, quintales, Lempiras) 
                y tiene precargadas las variedades de café reconocidas por <strong>IHCAFE</strong>.
            </p>
            <p style="color:var(--cafe-600);font-size:0.9rem;">
                ✅ Funciona 100% sin internet · ✅ Tus datos se guardan localmente · ✅ Backup automático
            </p>

            <h3 style="color:var(--cafe-700);margin-top:28px;">🏁 Primeros Pasos</h3>
            <div class="card" style="border-left:4px solid var(--verde-hoja);margin-bottom:16px;">
                <div class="card-body">
                    <ol style="margin:0;padding-left:20px;line-height:2;">
                        <li><strong>Registra tu finca</strong> — Ve a <em>"Mi Finca"</em> e ingresa los datos generales</li>
                        <li><strong>Crea tus lotes</strong> — En <em>"Lotes"</em>, registra cada parcela con su variedad y área</li>
                        <li><strong>Registra la cosecha</strong> — Cada día de corte, ve a <em>"Cosecha"</em> y anota las latas</li>
                        <li><strong>Procesa el beneficio</strong> — Al beneficiar, registra en <em>"Beneficio"</em> para conocer tu rendimiento</li>
                        <li><strong>Controla gastos</strong> — Ve a <em>"Gastos"</em> y lleva el control de tus costos</li>
                        <li><strong>Genera reportes</strong> — En <em>"Reportes"</em> exporta tus datos a PDF o Excel</li>
                    </ol>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">🏘️ Módulo: Mi Finca</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Esta pantalla registra los <strong>datos generales de la finca</strong>. Solo puede haber 
                        una finca registrada.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Nombre de la finca</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">El nombre de tu finca (ej: "El Paraíso")</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Ubicación</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Aldea, municipio y departamento (ej: "Montecristo, Copán")</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Altitud (msnm)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Metros sobre el nivel del mar (ej: 1200)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Área total (mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área total de la finca en manzanas (1 mz ≈ 0.7 ha)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Área de café (mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área sembrada de café (debe ser ≤ área total)</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Certificaciones</td><td style="padding:8px 12px;">Orgánico, Rainforest, Comercio Justo, UTZ, etc.</td></tr>
                    </table>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">🌳 Módulo: Lotes</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Los <strong>lotes o parcelas</strong> son las unidades productivas de la finca. 
                        Cada lote se siembra con una variedad específica y tiene su propio historial.
                    </p>
                    <p style="background:var(--crema);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                        <strong>➡️ Botón "+ Nuevo Lote":</strong> Abre un formulario para registrar un nuevo lote.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Código</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Nombre corto del lote (ej: "Lote A", "La Montaña")</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Área (mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área del lote en manzanas</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Variedad</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Elige entre: Catuaí, Parainema, IHCAFE 90, Lempira, Bourbon, Caturra, Typica, Pacas, Maragogipe, Geisha</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Año de siembra</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Año en que se sembró el lote</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Densidad (plantas/mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Número de plantas por manzana (ej: 5000)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Altitud del lote</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Altitud específica del lote en msnm</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Exposición</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Orientación solar: Norte, Sur, Este, Oeste o Plano</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Tipo de suelo</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Franco, Arcilloso, Arenoso, Franco-arcilloso, etc.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Estado</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span class="badge badge-produccion">Producción</span> · <span class="badge badge-reposicion">Reposición</span> · <span class="badge badge-descanso">Descanso</span> · <span class="badge badge-nuevo">Nuevo</span></td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Observaciones</td><td style="padding:8px 12px;">Notas adicionales (plagas, tratamientos, etc.)</td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                        ✏️ Para <strong>editar</strong> un lote, haz clic en el botón ✏️ en la tabla.<br>
                        🗑️ Para <strong>eliminar</strong>, haz clic en 🗑️ (se te pedirá confirmación).
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">📅 Módulo: Cosecha / Recolección</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Este es el <strong>módulo más importante</strong> de la aplicación. Se usa a diario 
                        durante la temporada de cosecha (octubre a marzo en Honduras).
                    </p>
                    <p style="background:var(--crema);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                        <strong>➡️ Botón "+ Nuevo Corte":</strong> Abre un formulario para registrar una recolección del día.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Fecha</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Por defecto la fecha de hoy</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Lote</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Selecciona el lote donde se recolectó</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Recolector</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Selecciona un recolector existente o agrega uno nuevo</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Latas</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Número de latas recolectadas. 1 lata ≈ 18 kg. Los kilos se calculan automáticamente.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Madurez</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Maduro, Verde, Pintón, Sobremaduro o Mixto</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Precio por lata</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Precio pagado al recolector por lata. El total a pagar se calcula automáticamente.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Hora inicio / fin</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Horario de la jornada de recolección</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Observaciones</td><td style="padding:8px 12px;">Notas adicionales</td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                        📊 La <strong>barra de resumen</strong> muestra los totales del día: latas, kilos y monto pagado.
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">🔄 Módulo: Beneficio Húmedo</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Registra el <strong>procesamiento del café</strong> (despulpado → fermentación → lavado → secado). 
                        El sistema calcula automáticamente el <strong>rendimiento</strong>, que es el porcentaje 
                        de pergamino obtenido respecto a la cereza ingresada.
                    </p>
                    <p style="background:var(--crema);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                        <strong>➡️ Botón "+ Nuevo Proceso":</strong> Abre un formulario para registrar un beneficio.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Lote de origen</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Lote del que proviene la cereza</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Cereza ingresada</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Kilos de café cereza que entran al beneficio</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Método</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Lavado, Honey o Natural</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Fermentación</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Horas de fermentación</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Tipo de secado</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Sol, Mecánico, Combinado o Silo</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Humedad final</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Porcentaje de humedad (rango ideal: 10-12%)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Pergamino obtenido</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Kilos de pergamino seco obtenidos</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Rendimiento %</td><td style="padding:8px 12px;"><strong>Calculado automáticamente:</strong> pergamino ÷ cereza × 100.<br>
                            <span class="rend-badge rend-excelente">Excelente &gt;24%</span> · 
                            <span class="rend-badge rend-bueno">Bueno 20-24%</span> · 
                            <span class="rend-badge rend-regular">Regular 16-20%</span> · 
                            <span class="rend-badge rend-malo">Bajo &lt;16%</span>
                        </td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;background:var(--cafe-50);padding:8px 12px;border-radius:6px;">
                        💡 <strong>Nota:</strong> Al guardar un beneficio, el pergamino se registra automáticamente como 
                        entrada en el Inventario.
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">📦 Módulo: Inventario</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Controla las <strong>existencias en almacén</strong>: cereza, pergamino húmedo, 
                        pergamino seco, café verde (trillado) y café tostado.
                    </p>
                    <p style="background:var(--crema);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                        <strong>➡️ Botón "+ Movimiento":</strong> Abre un formulario para registrar una entrada, salida o venta.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Tipo de producto</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Cereza, Pergamino Húmedo, Pergamino Seco, Verde o Tostado</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Tipo de movimiento</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Entrada (ingresa al almacén), Salida (sale del almacén), Venta (se vende a un cliente)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Cantidad (qq)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Cantidad en quintales (1 qq = 46 kg). Los kilos se calculan automáticamente.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Cliente / Destino</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Nombre del cliente o destino (para salidas/ventas)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Precio de venta/qq</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Precio de venta por quintal. El total se calcula automáticamente.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Lote de procedencia</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Lote del que proviene el producto</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Ubicación</td><td style="padding:8px 12px;">Bodega o ubicación en el almacén</td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                        📊 Las <strong>tarjetas de resumen</strong> en la parte superior muestran las existencias actuales 
                        de cada tipo de producto en quintales y kilos.
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">💰 Módulo: Gastos</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Lleva el control de todos los <strong>costos de producción</strong> de tu finca.
                    </p>
                    <p style="background:var(--crema);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                        <strong>➡️ Botón "+ Nuevo Gasto":</strong> Abre un formulario para registrar un gasto.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué registrar?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Categoría</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Fertilizante, Fungicida, Herbicida, Mano de obra, Transporte, Insumos, Maquinaria, Mantenimiento, Servicios, Otros</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Descripción</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Detalle del gasto (ej: "10 sacos de fertilizante 15-15-15")</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Lote</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Opcional. Selecciona el lote al que se aplica el gasto</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Cantidad y unidad</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Ej: 10 sacos, 5 jornales, 20 litros</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Costo unitario</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Precio por unidad. El costo total se calcula automáticamente.</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">Proveedor</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Nombre del proveedor</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">Factura</td><td style="padding:8px 12px;">Número de factura o comprobante</td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                        📊 Usa los <strong>filtros</strong> por fecha, categoría y lote para analizar tus gastos.<br>
                        🍩 El <strong>gráfico de dona</strong> muestra la distribución de gastos por categoría.
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">📊 Módulo: Reportes</h3>
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <p style="margin-top:0;line-height:1.6;">
                        Genera <strong>reportes exportables</strong> para analizar tu producción y tomar decisiones.
                    </p>
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;width:200px;">Reporte</th><th style="background:var(--cafe-100);color:var(--cafe-800);padding:8px 12px;text-align:left;">¿Qué incluye?</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">📊 Resumen de Temporada</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">KPI generales: lotes, kilos cosechados, rendimiento promedio, ingresos vs gastos</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">🌳 Rendimiento por Lote</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Comparativa de producción (qq/mz) por lote y variedad</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);font-weight:600;">💰 Estado de Resultados</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Ingresos totales - Costos totales = Utilidad o Pérdida de la temporada</td></tr>
                        <tr><td style="padding:8px 12px;font-weight:600;">👥 Productividad x Recolector</td><td style="padding:8px 12px;">Ranking de recolectores por kilos y total pagado</td></tr>
                    </table>
                    <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                        📥 Cada reporte se puede exportar como <strong>PDF</strong> o <strong>Excel</strong>.
                    </p>
                </div>
            </div>

            <h3 style="color:var(--cafe-700);margin-top:28px;">💡 Consejos de Uso</h3>
            <div class="card" style="border-left:4px solid var(--oro-cafe);">
                <div class="card-body">
                    <ul style="margin:0;padding-left:20px;line-height:1.8;">
                        <li><strong>Registra diariamente</strong> — La cosecha se registra mejor el mismo día</li>
                        <li><strong>Mantén actualizados los gastos</strong> — Así sabrás tu costo real de producción</li>
                        <li><strong>Revisa el rendimiento</strong> — Un rendimiento bajo puede indicar problemas en el beneficio</li>
                        <li><strong>Genera reportes al final</strong> — Al terminar la cosecha, exporta todo para tu análisis</li>
                        <li><strong>Backup automático</strong> — La app guarda una copia en <em>Documentos/CafetalOS/Respaldos/</em> cada vez que cierras</li>
                    </ul>
                </div>
            </div>
        `;
    },

    // ─── Sección 2: Glosario de Términos Cafetaleros ───
    renderGlosario() {
        const terminos = [
            { termino: 'Manzana (mz)', def: 'Unidad de área tradicional en Centroamérica. 1 manzana ≈ 0.7 hectáreas (7,000 m²). Es la medida estándar para fincas de café en Honduras.' },
            { termino: 'Lata', def: 'Unidad de recolección de café cereza. 1 lata ≈ 18 kg de café cereza (aunque puede variar entre 16-20 kg según la zona). Es la unidad más usada para pagar al recolector.' },
            { termino: 'Quintal (qq)', def: 'Unidad de peso usada para comercializar café. 1 quintal = 100 libras ≈ 46 kg. El café pergamino seco y el café verde se cotizan en quintales.' },
            { termino: 'Cereza', def: 'Fruto maduro del café tal como se recolecta del árbol. También llamado "café uva" o "café cherry". Es la materia prima para el beneficio.' },
            { termino: 'Pergamino', def: 'Café después del beneficio húmedo, con la capa de pergamino (endocarpio) aún adherida. Es el producto intermedio antes del trillado.' },
            { termino: 'Café Verde / Trillado', def: 'Café pergamino después de pasar por la trilladora, que le retira la capa de pergamino. Es el café listo para tostar y exportar.' },
            { termino: 'Café Tostado', def: 'Café verde sometido al proceso de tostión, listo para moler y consumir como bebida.' },
            { termino: 'Beneficio Húmedo', def: 'Proceso de transformación del café cereza a café pergamino. Incluye: despulpado, fermentación, lavado y secado. Es el método predominante en Honduras.' },
            { termino: 'Despulpado', def: 'Primera etapa del beneficio. Consiste en retirar la pulpa (cáscara externa) del café cereza usando una despulpadora mecánica.' },
            { termino: 'Fermentación', def: 'Etapa donde los granos despulpados se dejan reposar en tanques para que las enzimas naturales descompongan la capa de mucílago (miel). Dura entre 12-24 horas según la temperatura.' },
            { termino: 'Lavado', def: 'Después de la fermentación, los granos se lavan con agua limpia para retirar todo el mucílago descompuesto.' },
            { termino: 'Secado', def: 'Etapa final del beneficio húmedo. Reduce la humedad del café del 55% a 10-12%. Puede ser al sol (patios, camas africanas) o mecánico (secadoras).' },
            { termino: 'Rendimiento', def: 'Porcentaje de pergamino seco obtenido respecto a la cereza ingresada. Fórmula: (kg pergamino ÷ kg cereza) × 100. Un buen rendimiento es >22%.' },
            { termino: 'msnm', def: 'Metros sobre el nivel del mar. La altitud es clave para la calidad del café. En Honduras, el café se cultiva entre 600 y 1,700 msnm. A mayor altitud, mayor calidad (y menor rendimiento).' },
            { termino: 'Catuaí', def: 'Variedad de café arábica muy cultivada en Honduras. Es un híbrido de Mundo Novo y Caturra. Buena productividad y resistencia.' },
            { termino: 'Parainema', def: 'Variedad hondureña desarrollada por IHCAFE. Resistente a la roya del café. Muy cultivada en zonas de media altitud (800-1,200 msnm).' },
            { termino: 'IHCAFE 90', def: 'Variedad creada por el Instituto Hondureño del Café. Resistente a la roya y de buena taza. Una de las más plantadas en el país.' },
            { termino: 'Lempira', def: 'Variedad hondureña, también resistente a la roya. Desarrollada por IHCAFE en los años 90. Buena adaptación a diferentes altitudes.' },
            { termino: 'Roya del Café', def: 'Enfermedad fúngica (Hemileia vastatrix) que ataca las hojas del café. Es la principal amenaza fitosanitaria en Honduras. Las variedades IHCAFE y Parainema son resistentes.' },
            { termino: 'IHCAFE', def: 'Instituto Hondureño del Café. Es la entidad gubernamental que regula, investiga y promueve la caficultura en Honduras. Con sede en Comayagüela, Tegucigalpa.' },
            { termino: 'Cosecha (Corte)', def: 'Periodo de recolección del café maduro. En Honduras va de octubre a marzo (según la altitud). Es la etapa que requiere más mano de obra.' },
            { termino: 'Floración', def: 'Etapa en que el cafeto produce flores blancas, generalmente después de las primeras lluvias de mayo. En Honduras hay 2-3 floraciones principales.' },
            { termino: 'Cama Africana', def: 'Mesa elevada con malla para secar café al sol. Permite mejor circulación de aire y secado más uniforme que el patio tradicional.' },
            { termino: 'Lote o Parcela', def: 'División productiva de la finca. Cada lote tiene sus propias características: variedad, edad, altitud, exposición y tipo de suelo.' }
        ];

        let html = `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                🔬 Glosario de Términos Cafetaleros
            </h2>
            <p style="color:var(--cafe-600);margin-bottom:20px;">
                Términos y conceptos utilizados en la caficultura hondureña, organizados dentro de la aplicación.
            </p>
        `;

        terminos.forEach((t, i) => {
            html += `
                <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;${i < terminos.length - 1 ? 'border-bottom:1px solid var(--cafe-100);' : ''}">
                    <div style="font-size:1.2rem;width:32px;height:32px;background:var(--cafe-100);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        📌
                    </div>
                    <div>
                        <div style="font-weight:700;color:var(--cafe-800);font-size:1rem;">${t.termino}</div>
                        <div style="color:var(--cafe-500);font-size:0.9rem;line-height:1.5;margin-top:4px;">${t.def}</div>
                    </div>
                </div>
            `;
        });

        return html;
    },

    // ─── Sección 3: Flujo del Proceso del Café ───
    renderFlujo() {
        return `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                🔄 Flujo del Proceso del Café
            </h2>
            <p style="color:var(--cafe-600);margin-bottom:20px;line-height:1.6;">
                Así es el ciclo completo del café, desde la siembra hasta la taza. Las etapas marcadas 
                con <strong>negrita</strong> son las que puedes registrar en Cafetal OS.
            </p>

            <div style="position:relative;padding-left:40px;">

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:#2E7D32;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">1</div>
                    <div style="background:#f0f7f0;padding:16px 20px;border-radius:8px;border-left:4px solid #2E7D32;">
                        <div style="font-weight:700;font-size:1.1rem;color:#2E7D32;">🌱 Siembra</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            Se siembran las semillas en almácigos y luego se transplantan al campo definitivo. 
                            Un cafeto tarda de 3 a 4 años en dar su primera cosecha comercial.
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:#4E342E;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">2</div>
                    <div style="background:var(--cafe-50);padding:16px 20px;border-radius:8px;border-left:4px solid var(--cafe-600);">
                        <div style="font-weight:700;font-size:1.1rem;color:var(--cafe-700);">🌳 Crecimiento del Cafeto</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            Durante 3-4 años el cafeto crece y se desarrolla. Se aplican fertilizantes, 
                            fungicidas y se realiza mantenimiento. <strong>Registra estos gastos en "Gastos".</strong>
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:var(--oro-cafe);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">3</div>
                    <div style="background:#FFF8E1;padding:16px 20px;border-radius:8px;border-left:4px solid var(--oro-cafe);">
                        <div style="font-weight:700;font-size:1.1rem;color:#E65100;">🌸 Floración y Maduración</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            Después de las lluvias (mayo-junio), el cafeto florece. Los frutos tardan 
                            6-8 meses en madurar. La cosecha en Honduras va de <strong>octubre a marzo</strong>, 
                            según la altitud de la finca.
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:#C62828;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">4</div>
                    <div style="background:#FFEBEE;padding:16px 20px;border-radius:8px;border-left:4px solid #C62828;font-weight:700;">
                        <div style="font-size:1.1rem;color:#C62828;">👨‍🌾 RECOLECCIÓN (Corte)</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;font-weight:400;">
                            Los recolectores cortan manualmente las cerezas maduras. Se paga por lata recolectada. 
                            <strong>📅 Registra cada corte en "Cosecha".</strong> Es la etapa más costosa: 
                            representa el 60-70% del costo total de producción.
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:var(--cafe-700);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">5</div>
                    <div style="background:var(--cafe-50);padding:16px 20px;border-radius:8px;border-left:4px solid var(--cafe-700);">
                        <div style="font-weight:700;font-size:1.1rem;color:var(--cafe-800);">🏭 BENEFICIO HÚMEDO</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            <strong>🔄 Registra este proceso en "Beneficio".</strong>
                        </div>
                    </div>
                    <div style="margin-left:32px;margin-top:8px;">
                        <div style="display:flex;gap:12px;flex-wrap:wrap;">
                            <div style="flex:1;min-width:120px;padding:10px 14px;background:white;border-radius:6px;border:1px solid var(--cafe-200);text-align:center;">
                                <div style="font-size:1.3rem;">⚙️</div>
                                <div style="font-weight:600;font-size:0.85rem;">Despulpado</div>
                            </div>
                            <div style="flex:1;min-width:120px;padding:10px 14px;background:white;border-radius:6px;border:1px solid var(--cafe-200);text-align:center;">
                                <div style="font-size:1.3rem;">🧪</div>
                                <div style="font-weight:600;font-size:0.85rem;">Fermentación</div>
                            </div>
                            <div style="flex:1;min-width:120px;padding:10px 14px;background:white;border-radius:6px;border:1px solid var(--cafe-200);text-align:center;">
                                <div style="font-size:1.3rem;">💧</div>
                                <div style="font-weight:600;font-size:0.85rem;">Lavado</div>
                            </div>
                            <div style="flex:1;min-width:120px;padding:10px 14px;background:white;border-radius:6px;border:1px solid var(--cafe-200);text-align:center;">
                                <div style="font-size:1.3rem;">☀️</div>
                                <div style="font-weight:600;font-size:0.85rem;">Secado</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:var(--cafe-400);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">6</div>
                    <div style="background:white;padding:16px 20px;border-radius:8px;border:1px solid var(--cafe-200);">
                        <div style="font-weight:700;font-size:1.1rem;color:var(--cafe-700);">📦 Pergamino Seco → Almacén</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            El café pergamino seco se almacena en sacos, listo para la venta o trillado. 
                            <strong>📦 Registra en "Inventario" las entradas, salidas y ventas.</strong>
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:30px;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:#5D4037;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">7</div>
                    <div style="background:#EFEBE9;padding:16px 20px;border-radius:8px;border-left:4px solid #5D4037;">
                        <div style="font-weight:700;font-size:1.1rem;color:#3E2723;">⚙️ Trillado → Café Verde</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            El pergamino pasa por la trilladora que retira la capa de pergamino. 
                            Se obtiene café verde (trillado), listo para exportación o tostión.
                        </div>
                    </div>
                </div>

                <div style="position:relative;padding-bottom:0;">
                    <div style="position:absolute;left:-24px;top:4px;width:32px;height:32px;background:var(--rojo-cafe);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">8</div>
                    <div style="background:#FFF3E0;padding:16px 20px;border-radius:8px;border-left:4px solid var(--oro-cafe);">
                        <div style="font-weight:700;font-size:1.1rem;color:#E65100;">🔥 Tostión → ☕ Consumo</div>
                        <div style="color:var(--cafe-500);margin-top:4px;line-height:1.5;">
                            El café verde se tuesta a diferentes niveles (claro, medio, oscuro) para desarrollar 
                            los sabores. Luego se muele y se prepara como bebida. 
                            <strong>¡De la finca a la taza!</strong>
                        </div>
                    </div>
                </div>

            </div>

            <div class="card" style="margin-top:28px;border-left:4px solid var(--cafe-600);">
                <div class="card-header">📐 Fórmula Clave: Rendimiento</div>
                <div class="card-body" style="text-align:center;">
                    <div style="font-size:1.4rem;font-weight:700;color:var(--cafe-800);margin:16px 0;">
                        Rendimiento = (Kilos de Pergamino ÷ Kilos de Cereza) × 100
                    </div>
                    <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;">
                        <div><span class="rend-badge rend-excelente">Excelente &gt;24%</span></div>
                        <div><span class="rend-badge rend-bueno">Bueno 20-24%</span></div>
                        <div><span class="rend-badge rend-regular">Regular 16-20%</span></div>
                        <div><span class="rend-badge rend-malo">Bajo &lt;16%</span></div>
                    </div>
                    <div style="margin-top:12px;font-size:0.85rem;color:var(--cafe-400);">
                        Ejemplo: 340 kg de pergamino ÷ 1,500 kg de cereza = 22.7% (Bueno)
                    </div>
                </div>
            </div>
        `;
    },

    // ─── Sección 4: Guía por Pantalla (Interfaces) ───
    renderInterfaces() {
        return `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                🖥️ Guía por Pantalla
            </h2>
            <p style="color:var(--cafe-600);margin-bottom:20px;line-height:1.6;">
                A continuación se explica en detalle cada pantalla de la aplicación, campo por campo, 
                para que sepas exactamente qué información registrar en cada una.
            </p>

            ${this.renderInterfaceCard('🏠', 'Inicio / Dashboard', 'Panel principal con indicadores clave',
                `<p>Al abrir la aplicación, esta es la primera pantalla que ves. Su propósito es darte una <strong>vista rápida del estado de tu finca</strong>.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Elementos del Dashboard:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>🌳 Lotes Activos</strong> — Número de lotes en estado "producción" o "nuevo"</li>
                    <li><strong>📐 Área Total</strong> — Suma del área de todos tus lotes (en manzanas)</li>
                    <li><strong>📦 Latas este Mes</strong> — Total de latas recolectadas en el mes actual</li>
                    <li><strong>⚖️ Kilos este Mes</strong> — Total de kilos recolectados en el mes actual</li>
                    <li><strong>📈 Gráfico de Cosecha</strong> — Muestra las latas y kilos de los últimos 30 días</li>
                    <li><strong>🔘 Accesos Rápidos</strong> — Botones para ir directamente a las funciones más usadas</li>
                </ul>`
            )}

            ${this.renderInterfaceCard('🏘️', 'Mi Finca', 'Registro de datos generales de la finca',
                `<p>Esta pantalla captura la <strong>información general de tu finca</strong>. Solo puedes tener una finca registrada a la vez.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Campos del formulario:</h4>
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                    <tr><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;width:180px;">Campo</th><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Descripción</th></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Nombre</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">El nombre de tu finca (ej: "El Paraíso", "La Bendición")</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Ubicación</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Aldea, municipio, departamento (ej: "Montecristo, Copán")</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Altitud (msnm)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Altitud promedio de la finca. En Honduras, entre 600 y 1,700 msnm</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área total (mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área total del terreno en manzanas</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área de café (mz)</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Área sembrada con café (debe ser menor o igual al área total)</td></tr>
                    <tr><td style="padding:8px 12px;">Certificaciones</td><td style="padding:8px 12px;">Orgánico, Rainforest Alliance, Comercio Justo, UTZ, etc.</td></tr>
                </table>`
            )}

            ${this.renderInterfaceCard('🌳', 'Lotes', 'Gestión de parcelas o lotes de café',
                `<p>Los <strong>lotes</strong> son la unidad productiva básica. Cada lote tiene sus propias características y su historial de cosecha, beneficio y gastos.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Tabla de lotes:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>Ver listado</strong> — Todos los lotes aparecen en una tabla con su información principal</li>
                    <li><strong>➕ Nuevo Lote</strong> — Botón que abre el modal para agregar un lote</li>
                    <li><strong>✏️ Editar</strong> — Haz clic en el ícono de lápiz para modificar un lote existente</li>
                    <li><strong>🗑️ Eliminar</strong> — Haz clic en el ícono de papelera para eliminar (requiere confirmación)</li>
                </ul>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Formulario de lote (modal):</h4>
                <ul style="line-height:1.8;">
                    <li><strong>Código</strong> — Identificador corto (ej: "Lote-A", "Montaña", "B-Río")</li>
                    <li><strong>Área (mz)</strong> — Tamaño del lote en manzanas</li>
                    <li><strong>Variedad</strong> — Selecciona de la lista precargada con variedades IHCAFE</li>
                    <li><strong>Año de siembra</strong> — ¿Cuándo se sembró este lote?</li>
                    <li><strong>Densidad</strong> — Plantas por manzana (típicamente 3,000-6,000)</li>
                    <li><strong>Altitud del lote</strong> — Puede diferir de la altitud general de la finca</li>
                    <li><strong>Exposición</strong> — Orientación solar (Norte, Sur, Este, Oeste, Plano)</li>
                    <li><strong>Tipo de suelo</strong> — Franco, arcilloso, arenoso, etc.</li>
                    <li><strong>Estado</strong> — Producción (🟢), Reposición (🟡), Descanso (⚪), Nuevo (🔵)</li>
                    <li><strong>Observaciones</strong> — Notas adicionales importantes</li>
                </ul>`
            )}

            ${this.renderInterfaceCard('📅', 'Cosecha', 'Registro diario de recolección',
                `<p>Esta es la pantalla que <strong>más vas a usar durante la temporada de cosecha</strong> (octubre a marzo).</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">¿Cómo se usa?</h4>
                <ol style="line-height:1.8;">
                    <li>Selecciona la <strong>fecha</strong> del corte (por defecto hoy)</li>
                    <li>Haz clic en <strong>"+ Nuevo Corte"</strong></li>
                    <li>En el modal: elige el <strong>lote</strong> y el <strong>recolector</strong></li>
                    <li>Ingresa las <strong>latas</strong> recolectadas — los kilos se calculan solos</li>
                    <li>Indica el <strong>precio por lata</strong> — el total a pagar se calcula automáticamente</li>
                    <li>Selecciona la <strong>madurez</strong> del café</li>
                    <li>Opcional: ingresa hora de inicio y fin</li>
                    <li>Guarda el corte</li>
                </ol>
                <h4 style="color:var(--cafe-700);margin-top:16px;">En la pantalla:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>🔍 Fecha</strong> — Cambia la fecha para ver cortes de otros días</li>
                    <li><strong>📋 Tabla de cortes</strong> — Muestra todos los cortes del día seleccionado</li>
                    <li><strong>📊 Barra de resumen</strong> — Totales del día: latas, kilos, monto pagado</li>
                    <li><strong>👤 Recolectores</strong> — Puedes agregar nuevos recolectores desde el mismo modal</li>
                </ul>`
            )}

            ${this.renderInterfaceCard('🔄', 'Beneficio', 'Procesamiento de café (beneficio húmedo)',
                `<p>Registra el <strong>procesamiento del café cereza a pergamino seco</strong>. El sistema calcula automáticamente el rendimiento.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">¿Cómo se usa?</h4>
                <ol style="line-height:1.8;">
                    <li>Haz clic en <strong>"+ Nuevo Proceso"</strong></li>
                    <li>Selecciona el <strong>lote de origen</strong> de la cereza</li>
                    <li>Ingresa los <strong>kilos de cereza</strong> que entran al proceso</li>
                    <li>Selecciona el <strong>método</strong> (Lavado, Honey o Natural)</li>
                    <li>Registra <strong>horas de fermentación</strong></li>
                    <li>Selecciona <strong>tipo de secado</strong> (Sol, Mecánico, Combinado, Silo)</li>
                    <li>Ingresa los <strong>días de secado</strong></li>
                    <li>Registra la <strong>humedad final</strong> (ideal: 10-12%)</li>
                    <li>Ingresa los <strong>kilos de pergamino</strong> obtenidos</li>
                    <li>El sistema calcula y muestra el <strong>rendimiento %</strong></li>
                    <li>Guarda el proceso</li>
                </ol>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Importante:</h4>
                <p style="background:var(--cafe-50);padding:10px 14px;border-radius:6px;font-size:0.9rem;">
                    Al guardar un beneficio, el pergamino seco se <strong>registra automáticamente</strong> 
                    como una entrada en el Inventario.
                </p>`
            )}

            ${this.renderInterfaceCard('📦', 'Inventario', 'Control de existencias en almacén',
                `<p>Lleva el control de <strong>todo tu café almacenado</strong>: cereza, pergamino (húmedo y seco), verde y tostado.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">¿Qué ves en la pantalla?</h4>
                <ul style="line-height:1.8;">
                    <li><strong>📊 Tarjetas de existencias</strong> — Muestran lo que tienes actualmente de cada producto, en quintales y kilos</li>
                    <li><strong>📋 Tabla de movimientos</strong> — Historial de entradas, salidas y ventas</li>
                </ul>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Tipos de movimiento:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>Entrada</strong> — Café que ingresa al almacén (ej: del beneficio)</li>
                    <li><strong>Salida</strong> — Café que sale del almacén (ej: para trillado)</li>
                    <li><strong>Venta</strong> — Café que se vende a un cliente (captura precio y total)</li>
                </ul>
                <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                    💡 <strong>Consejo:</strong> Cuando vendas café, usa "Venta" en vez de "Salida" 
                    para llevar el control de ingresos por cliente y precio.
                </p>`
            )}

            ${this.renderInterfaceCard('💰', 'Gastos', 'Control de costos de producción',
                `<p>Registra todos los <strong>gastos de tu finca</strong> para conocer tu costo de producción real.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Categorías de gasto disponibles:</h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🧪 Fertilizante</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🧫 Fungicida</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🌿 Herbicida</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">👨‍🌾 Mano de obra</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🚛 Transporte</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">📦 Insumos</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🔧 Maquinaria</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">🛠️ Mantenimiento</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">📋 Servicios</span>
                    <span style="padding:4px 10px;background:var(--cafe-100);border-radius:12px;font-size:0.85rem;">📌 Otros</span>
                </div>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Filtros disponibles:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>📅 Por período</strong> — Selecciona rango de fechas</li>
                    <li><strong>🏷️ Por categoría</strong> — Filtra un tipo de gasto específico</li>
                    <li><strong>🌳 Por lote</strong> — Ve solo los gastos de un lote en particular</li>
                </ul>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Gráfico de dona:</h4>
                <p>Muestra la <strong>distribución porcentual</strong> de tus gastos por categoría. 
                Útil para identificar dónde se va la mayor parte del presupuesto (típicamente 
                >60% en mano de obra).</p>`
            )}

            ${this.renderInterfaceCard('📊', 'Reportes', 'Dashboard visual y exportación',
                `<p>Visualiza y exporta la <strong>información consolidada</strong> de tu finca.</p>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Gráficos del Dashboard:</h4>
                <ul style="line-height:1.8;">
                    <li><strong>📈 Rendimiento por Lote</strong> — Gráfico de barras comparativo entre lotes</li>
                    <li><strong>📦 Existencias</strong> — Gráfico de barras de tu inventario actual</li>
                </ul>
                <h4 style="color:var(--cafe-700);margin-top:16px;">Reportes exportables:</h4>
                <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                    <tr><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Reporte</th><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Contenido</th></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">📊 Resumen de Temporada</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">KPIs + resumen de cosecha + ingresos vs gastos</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">🌳 Rendimiento por Lote</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Producción por lote en qq/mz y kilos</td></tr>
                    <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">💰 Estado de Resultados</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Ingresos, costos y utilidad de la temporada</td></tr>
                    <tr><td style="padding:8px 12px;">👥 Recolectores</td><td style="padding:8px 12px;">Ranking de productividad y pagos por recolector</td></tr>
                </table>
                <p style="margin-top:12px;font-size:0.9rem;color:var(--cafe-500);">
                    📥 Cada reporte se puede descargar en <strong>PDF</strong> (para imprimir) o <strong>Excel</strong> 
                    (para analizar en hoja de cálculo).
                </p>`
            )}
        `;
    },

    renderInterfaceCard(icon, title, subtitle, content) {
        return `
            <div class="card" style="margin-bottom:16px;border-left:4px solid var(--cafe-400);">
                <div class="card-header" style="cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <span style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                        <span>${icon} ${title} <span style="font-weight:400;color:var(--cafe-400);font-size:0.85rem;">— ${subtitle}</span></span>
                        <span style="font-size:0.8rem;color:var(--cafe-400);">👁️ Ver detalles</span>
                    </span>
                </div>
                <div class="card-body">${content}</div>
            </div>
        `;
    },

    // ─── Sección 5: Preguntas Frecuentes ───
    renderFAQ() {
        const faqs = [
            { p: '¿Cómo empiezo a usar la aplicación?', r: 'Ve a <strong>"Mi Finca"</strong> y registra los datos de tu finca. Luego ve a <strong>"Lotes"</strong> y crea tus parcelas. Una vez tengas lotes, puedes empezar a registrar cosechas, beneficios, gastos, etc.' },
            { p: '¿Puedo usar la app sin internet?', r: '<strong>¡Sí!</strong> Cafetal OS funciona 100% offline. Todos tus datos se guardan localmente en tu computadora. No necesitas conexión a internet para nada.' },
            { p: '¿Dónde se guardan mis datos?', r: 'En la carpeta de datos de la aplicación: <code>%APPDATA%\\CafetalOS\\cafetal-os.db</code>. Es un archivo de base de datos SQLite que puedes respaldar manualmente.' },
            { p: '¿Cómo hago backup de mis datos?', r: 'La aplicación hace <strong>backup automático</strong> cada vez que la cierras. Las copias se guardan en <code>Documentos/CafetalOS/Respaldos/</code> con la fecha del día.' },
            { p: '¿Puedo exportar mis datos a Excel o PDF?', r: 'Sí. Ve a <strong>"Reportes"</strong> y encontrarás 4 tipos de reportes. Cada uno se puede exportar como PDF (para imprimir) o Excel (para analizar en hojas de cálculo).' },
            { p: '¿Qué hago si borro un lote por error?', r: 'Actualmente no hay papelera de reciclaje. <strong>Recomendación:</strong> en vez de borrar, cambia el estado del lote a "Descanso". Así no pierdes su historial de cosecha y gastos.' },
            { p: '¿Puedo personalizar las variedades de café?', r: 'Las variedades vienen precargadas con las 10 principales reconocidas por IHCAFE: Catuaí, Parainema, IHCAFE 90, Lempira, Bourbon, Caturra, Typica, Pacas, Maragogipe y Geisha. Si necesitas agregar más, contacta al desarrollador.' },
            { p: '¿Puedo tener más de una finca registrada?', r: 'En la versión actual solo puedes tener <strong>una finca</strong>. Si manejas múltiples fincas, se recomienda tener una instalación de Cafetal OS por finca.' },
            { p: '¿Cómo se calcula el rendimiento del beneficio?', r: 'El rendimiento se calcula con esta fórmula: <strong>(Kilos de pergamino seco ÷ Kilos de cereza ingresados) × 100</strong>. Por ejemplo, si ingresaste 1,500 kg de cereza y obtuviste 340 kg de pergamino, el rendimiento es 340/1500 × 100 = <strong>22.7%</strong> (considerado Bueno).' },
            { p: '¿Qué significan los colores del rendimiento?', r: '<span class="rend-badge rend-excelente">Excelente &gt;24%</span> — Rendimiento muy alto, excelente proceso.<br><span class="rend-badge rend-bueno">Bueno 20-24%</span> — Rendimiento normal y esperado.<br><span class="rend-badge rend-regular">Regular 16-20%</span> — Puede haber pérdidas en el proceso.<br><span class="rend-badge rend-malo">Bajo &lt;16%</span> — Revisa tu proceso de beneficio, hay pérdidas significativas.' },
            { p: '¿Cuánto es una manzana en hectáreas?', r: '1 manzana (mz) ≈ 0.7 hectáreas (ha). Es decir, 1 mz = 7,000 m² aproximadamente. Es la unidad de área tradicional en Honduras y Centroamérica.' },
            { p: '¿La app corre en Mac o Linux?', r: 'Actualmente está construida para <strong>Windows 10/11</strong>. Sin embargo, como está hecha en Electron.js, podría compilarse para macOS y Linux en el futuro.' },
            { p: '¿Cómo actualizo la aplicación?', r: 'Cuando haya una nueva versión, se te proporcionará un nuevo instalador. Tus datos no se pierden al actualizar porque la base de datos se guarda por separado en AppData.' },
            { p: '¿Tiene costo la aplicación?', r: 'No, Cafetal OS es <strong>completamente gratis</strong>. Es una herramienta desarrollada para apoyar al caficultor hondureño.' },
        ];

        let html = `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                ❓ Preguntas Frecuentes
            </h2>
            <p style="color:var(--cafe-600);margin-bottom:20px;">
                Respuestas a las dudas más comunes sobre el uso de Cafetal OS.
            </p>
        `;

        faqs.forEach((faq, i) => {
            html += `
                <div style="margin-bottom:12px;border:1px solid var(--cafe-100);border-radius:8px;overflow:hidden;">
                    <div style="padding:14px 16px;background:var(--cafe-50);font-weight:600;color:var(--cafe-800);cursor:pointer;display:flex;justify-content:space-between;align-items:center;"
                         onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.faq-toggle').textContent = this.nextElementSibling.classList.contains('hidden') ? '➕' : '➖';">
                        <span>${i+1}. ${faq.p}</span>
                        <span class="faq-toggle" style="font-size:1.1rem;">➕</span>
                    </div>
                    <div class="hidden" style="padding:14px 16px;line-height:1.6;font-size:0.95rem;color:var(--cafe-600);">
                        ${faq.r}
                    </div>
                </div>
            `;
        });

        return html;
    },

    // ─── Sección 6: Atajos de Teclado ───
    renderAtajos() {
        return `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                ⌨️ Atajos de Teclado
            </h2>
            <p style="color:var(--cafe-600);margin-bottom:20px;">
                Estos atajos te permiten navegar y usar la aplicación más rápido.
            </p>

            <div class="card" style="margin-bottom:16px;">
                <div class="card-header">Atajos de Navegación</div>
                <div class="card-body">
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);padding:10px 14px;text-align:left;width:200px;">Tecla</th><th style="background:var(--cafe-100);padding:10px 14px;text-align:left;">Acción</th></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Ctrl + N</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Abrir formulario de nuevo registro (donde aplique)</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Ctrl + S</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Guardar el formulario actual</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Ctrl + P</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Exportar reporte a PDF</td></tr>
                        <tr><td style="padding:10px 14px;"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Ctrl + E</kbd></td><td style="padding:10px 14px;">Exportar reporte a Excel</td></tr>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header">Atajos de Navegación entre Pantallas</div>
                <div class="card-body">
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);padding:10px 14px;text-align:left;width:200px;">Tecla</th><th style="background:var(--cafe-100);padding:10px 14px;text-align:left;">Acción</th></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 1</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Inicio / Dashboard</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 2</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Mi Finca</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 3</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Lotes</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 4</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Cosecha</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 5</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Beneficio</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 6</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Inventario</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 7</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Gastos</td></tr>
                        <tr><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 8</kbd></td><td style="padding:10px 14px;border-bottom:1px solid var(--cafe-100);">Reportes</td></tr>
                        <tr><td style="padding:10px 14px;"><kbd style="background:var(--cafe-800);color:white;padding:3px 8px;border-radius:4px;">Alt + 9</kbd></td><td style="padding:10px 14px;">Ayuda</td></tr>
                    </table>
                </div>
            </div>

            <div class="card" style="margin-top:16px;border-left:4px solid var(--oro-cafe);">
                <div class="card-header">💡 Consejo</div>
                <div class="card-body" style="font-size:0.9rem;color:var(--cafe-600);">
                    Los atajos de teclado son gestionados por el sistema operativo. Si algún atajo no funciona, 
                    verifica que no haya conflicto con otro programa (especialmente Ctrl+S que suele ser "Guardar" en muchos programas).
                </div>
            </div>
        `;
    },

    // ─── Sección 7: Acerca de ───
    renderAcerca() {
        return `
            <h2 style="color:var(--cafe-800);margin-top:0;border-bottom:2px solid var(--cafe-200);padding-bottom:12px;">
                ℹ️ Acerca de Cafetal OS
            </h2>

            <div style="text-align:center;padding:20px 0;">
                <div style="font-size:4rem;margin-bottom:12px;">☕</div>
                <h3 style="color:var(--cafe-800);margin:0;">Cafetal OS</h3>
                <div style="color:var(--cafe-400);font-size:1.1rem;">v1.0.0</div>
            </div>

            <div class="card" style="margin-bottom:16px;border-left:4px solid var(--cafe-600);">
                <div class="card-header">📌 Propósito</div>
                <div class="card-body" style="line-height:1.7;">
                    <p style="margin-top:0;">
                        <strong>Cafetal OS</strong> es un sistema de escritorio diseñado para ayudar al 
                        <strong>caficultor hondureño</strong> a llevar el control de su producción de café 
                        de manera sencilla, sin necesidad de internet y con herramientas adaptadas a la 
                        realidad del campo en Honduras.
                    </p>
                    <p>
                        Nació de la necesidad de tener una herramienta <strong>gratuita, offline y en español</strong> 
                        que usara las unidades y variedades locales (manzanas, latas, quintales, variedades IHCAFE) 
                        que los sistemas genéricos no incluyen.
                    </p>
                </div>
            </div>

            <div class="card" style="margin-bottom:16px;">
                <div class="card-header">⚙️ Stack Tecnológico</div>
                <div class="card-body">
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;width:200px;">Componente</th><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Tecnología</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Escritorio</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Electron.js</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Base de datos</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">SQLite (sql.js)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Frontend</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">HTML5 + CSS3 + JavaScript vanilla</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Gráficos</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Chart.js (offline)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Exportación PDF</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">pdfkit</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Exportación Excel</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">exceljs</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">Empaquetado</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">electron-builder (NSIS / Portable)</td></tr>
                        <tr><td style="padding:8px 12px;">IPC Seguro</td><td style="padding:8px 12px;">contextBridge + ipcRenderer/ipcMain</td></tr>
                    </table>
                </div>
            </div>

            <div class="card" style="margin-bottom:16px;">
                <div class="card-header">📋 Funcionalidades</div>
                <div class="card-body">
                    <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                        <tr><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Módulo</th><th style="background:var(--cafe-100);padding:8px 12px;text-align:left;">Estado</th></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">🏠 Dashboard</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span></td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">🏘️ Mi Finca</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span></td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">🌳 Lotes</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span> (CRUD)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">📅 Cosecha</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span></td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">🔄 Beneficio</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span> (rendimiento automático)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">📦 Inventario</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span></td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">💰 Gastos</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span> (10 categorías, filtros, gráficos)</td></tr>
                        <tr><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);">📊 Reportes</td><td style="padding:8px 12px;border-bottom:1px solid var(--cafe-100);"><span style="color:#2E7D32;">✅ Completo</span> (PDF + Excel)</td></tr>
                        <tr><td style="padding:8px 12px;">❓ Ayuda</td><td style="padding:8px 12px;"><span style="color:#2E7D32;">✅ Completo</span> (esta pantalla)</td></tr>
                    </table>
                </div>
            </div>

            <div class="card" style="border-left:4px solid var(--cafe-400);">
                <div class="card-header">🌎 Hecho para Honduras</div>
                <div class="card-body" style="line-height:1.7;color:var(--cafe-600);text-align:center;">
                    <p>
                        Desarrollado con ❤️ para los caficultores de Honduras.<br>
                        Unidades en manzanas, latas, quintales y Lempiras.<br>
                        Variedades IHCAFE precargadas. Funciona sin internet.
                    </p>
                    <p style="font-size:0.85rem;color:var(--cafe-400);">
                        © 2026 Cafetal OS — Código Abierto
                    </p>
                </div>
            </div>
        `;
    }
};

// Exposición global para acceso desde onclick
window.Ayuda = Ayuda;
