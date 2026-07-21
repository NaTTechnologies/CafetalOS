// ─── Módulo: Reportes ───

const Reportes = {
    async cargar(container) {
        try {
            const resumenLotes = await window.api.lotes.getResumen();
            const rendLotes = await window.api.beneficio.rendimientoPorLote();
            const inventario = await window.api.inventario.getResumen();
            const año = Utils.añoActual();
            const gastosTotal = await window.api.gastos.total(`${año}-01-01`, Utils.hoy());
            const cosechaAnual = await window.api.cosecha.getResumen(`${año}-01-01`, `${año}-12-31`);

            // ★ FLUJO 5: Cargar rentabilidad
            let rentabilidad = { total_ingresos: 0, costos_totales: 0, utilidad: 0, rentabilidad_porcentaje: 0 };
            try {
                rentabilidad = await window.api.dashboard.getRentabilidad(año);
            } catch(e) {}

            // ★ FLUJO 4: Cargar ranking de recolectores
            let rankingRecolectores = [];
            try {
                rankingRecolectores = await window.api.recolectores.getRanking(
                    `${año}-01-01`, Utils.hoy(), 10
                );
            } catch(e) {}

            container.innerHTML = `
                <div class="page-header">
                    <h2>📊 Reportes</h2>
                    <div class="flex gap-2">
                        <button class="btn btn-primary" onclick="Reportes.exportarPDF('temporada')">📥 PDF Temporada</button>
                        <button class="btn btn-outline" onclick="Reportes.exportarExcel('rentabilidad')">📥 Excel Rentabilidad</button>
                    </div>
                </div>
                <div class="page-body">
                    <div class="kpi-grid">
                        <div class="kpi-card kpi-green">
                            <div class="kpi-value">${resumenLotes.total_lotes}</div>
                            <div class="kpi-label">🌳 Lotes</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value">${Utils.numero(cosechaAnual.total_latas, 0)}</div>
                            <div class="kpi-label">📦 Latas Año ${año}</div>
                        </div>
                        <div class="kpi-card kpi-gold">
                            <div class="kpi-value">${Utils.numero(cosechaAnual.total_kilos, 0)} kg</div>
                            <div class="kpi-label">⚖️ Kilos Año ${año}</div>
                        </div>
                        <div class="kpi-card kpi-red">
                            <div class="kpi-value">${Utils.moneda(rentabilidad.utilidad)}</div>
                            <div class="kpi-label">💰 Utilidad ${año}</div>
                        </div>
                    </div>

                    <!-- ★ FLUJO 5: Rentabilidad -->
                    <div class="card">
                        <div class="card-header">📊 Rentabilidad de Temporada ${año}</div>
                        <div class="card-body">
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
                                <div style="text-align:center;padding:12px;background:#E8F5E9;border-radius:8px;">
                                    <div style="font-size:0.8rem;color:var(--cafe-500);text-transform:uppercase;">Ingresos (Ventas)</div>
                                    <div style="font-size:1.5rem;font-weight:700;color:#2E7D32;">${Utils.moneda(rentabilidad.total_ingresos)}</div>
                                </div>
                                <div style="text-align:center;padding:12px;background:#FFEBEE;border-radius:8px;">
                                    <div style="font-size:0.8rem;color:var(--cafe-500);text-transform:uppercase;">Costos Totales</div>
                                    <div style="font-size:1.5rem;font-weight:700;color:#C62828;">${Utils.moneda(rentabilidad.costos_totales)}</div>
                                </div>
                                <div style="text-align:center;padding:12px;background:${rentabilidad.utilidad >= 0 ? '#E3F2FD' : '#FFEBEE'};border-radius:8px;">
                                    <div style="font-size:0.8rem;color:var(--cafe-500);text-transform:uppercase;">Utilidad</div>
                                    <div style="font-size:1.5rem;font-weight:700;color:${rentabilidad.utilidad >= 0 ? '#1565C0' : '#C62828'};">${Utils.moneda(rentabilidad.utilidad)}</div>
                                </div>
                                <div style="text-align:center;padding:12px;background:${rentabilidad.rentabilidad_porcentaje >= 0 ? '#E8F5E9' : '#FFEBEE'};border-radius:8px;">
                                    <div style="font-size:0.8rem;color:var(--cafe-500);text-transform:uppercase;">Rentabilidad</div>
                                    <div style="font-size:1.5rem;font-weight:700;color:${rentabilidad.rentabilidad_porcentaje >= 0 ? '#2E7D32' : '#C62828'};">${Utils.numero(rentabilidad.rentabilidad_porcentaje, 1)}%</div>
                                </div>
                            </div>
                            <div style="margin-top:8px;font-size:0.8rem;color:var(--cafe-400);text-align:center;">
                                Costos: Gastos (${Utils.moneda(rentabilidad.costos_gastos)}) + Cosecha (${Utils.moneda(rentabilidad.costos_cosecha)})
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <div class="card">
                            <div class="card-header">🌳 Rendimiento por Lote</div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm">
                                    <canvas id="chartRendLotes"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">📦 Existencias en Inventario</div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm">
                                    <canvas id="chartInventario"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ★ FLUJO 4: Ranking de Recolectores -->
                    <div class="card">
                        <div class="card-header">👥 Ranking de Recolectores ${año}</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr><th>#</th><th>Nombre</th><th>Cortes</th><th>Latas</th><th>Kilos</th><th>Total Pagado</th><th>kg/Lata</th></tr>
                                    </thead>
                                    <tbody>
                                        ${rankingRecolectores.length === 0 ?
                                            '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--cafe-400);">No hay datos de recolectores.</td></tr>' :
                                            rankingRecolectores.map((r, i) => `<tr>
                                                <td><strong>${i + 1}</strong></td>
                                                <td>${Utils.escapar(r.nombre_completo)}</td>
                                                <td>${r.total_cortes}</td>
                                                <td>${Utils.numero(r.total_latas, 0)}</td>
                                                <td><strong>${Utils.numero(r.total_kilos, 0)} kg</strong></td>
                                                <td>${Utils.moneda(r.total_pagado)}</td>
                                                <td>${r.peso_promedio_lata || '-'}</td>
                                            </tr>`).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">📄 Reportes Disponibles</div>
                        <div class="card-body">
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarPDF('temporada')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">📊</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Resumen Temporada</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">KPI + rentabilidad + lotes</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarPDF('lotes')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">🌳</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Rendimiento Lotes</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Comparativa por variedad</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarPDF('costos')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">💰</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Estado Costos</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Por categoría y período</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarPDF('inventario')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">📦</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Inventario</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Existencias en almacén</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarExcel('ranking')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">👥</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Ranking Recolectores</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Kilos y pagos por persona</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--cafe-100);" onclick="Reportes.exportarExcel('rentabilidad')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">💹</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Rentabilidad</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Ingresos, costos, utilidad</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid var(--verde-cafe);" onclick="Sostenibilidad.exportarReporteEUDR()">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">🌱</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Reporte EUDR</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Sostenibilidad + deforestación cero</p>
                                    </div>
                                </div>
                                <div class="card" style="cursor:pointer;border:2px solid #1565C0;" onclick="Reportes.exportarPDF('huella')">
                                    <div class="card-body text-center" style="padding:16px;">
                                        <div style="font-size:2rem;">🏭</div>
                                        <h4 style="margin:8px 0 4px;font-size:0.9rem;">Huella de Carbono</h4>
                                        <p style="font-size:0.8rem;color:var(--cafe-400);margin:0;">Emisiones CO₂e por tipo</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Gráficos
            this.graficoRendimiento(rendLotes);
            this.graficoInventario(inventario);

        } catch (err) {
            console.error('Error cargando reportes:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar reportes.</p></div>`;
        }
    },

    graficoRendimiento(datos) {
        const canvas = document.getElementById('chartRendLotes');
        if (!canvas) return;
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: datos.map(d => d.codigo),
                datasets: [{
                    label: 'Rendimiento (%)',
                    data: datos.map(d => d.rend_promedio),
                    backgroundColor: '#795548',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: '%' } }
                }
            }
        });
    },

    graficoInventario(datos) {
        const canvas = document.getElementById('chartInventario');
        if (!canvas) return;
        const labelsMap = {
            'cereza': 'Cereza', 'pergamino_humedo': 'Perg. Húmedo',
            'pergamino_seco': 'Perg. Seco', 'verde': 'Verde', 'tostado': 'Tostado'
        };
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: datos.map(d => labelsMap[d.tipo_producto] || d.tipo_producto),
                datasets: [{
                    label: 'Existencias (qq)',
                    data: datos.map(d => d.existencias_qq),
                    backgroundColor: ['#2E7D32','#1565C0','#795548','#FF8F00','#C62828'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, title: { display: true, text: 'qq' } } }
            }
        });
    },

    // ─── Exportar PDF ───
    async exportarPDF(tipo) {
        try {
            let titulo, contenido;

            const año = Utils.añoActual();
            const cosechaAnual = await window.api.cosecha.getResumen(`${año}-01-01`, `${año}-12-31`);
            const gastosTotal = await window.api.gastos.total(`${año}-01-01`, Utils.hoy());
            const lotes = await window.api.lotes.getAll();
            const rendLotes = await window.api.beneficio.rendimientoPorLote();
            const rentabilidad = await window.api.dashboard.getRentabilidad(año).catch(() => null);

            switch(tipo) {
                case 'temporada':
                    titulo = `Resumen de Temporada ${año}`;
                    contenido = `
                        Resumen de Temporada ${año}
                        
                        TOTALES DE COSECHA:
                        - Latas: ${Utils.numero(cosechaAnual.total_latas, 0)}
                        - Kilos: ${Utils.numero(cosechaAnual.total_kilos, 0)}
                        - Pagado a Recolectores: ${Utils.moneda(cosechaAnual.total_pagado)}
                        
                        GASTOS TOTALES: ${Utils.moneda(gastosTotal.total)}
                        
                        RENTABILIDAD:
                        ${rentabilidad ? `
                        - Ingresos por Ventas: ${Utils.moneda(rentabilidad.total_ingresos)}
                        - Costos Totales: ${Utils.moneda(rentabilidad.costos_totales)}
                        - Utilidad: ${Utils.moneda(rentabilidad.utilidad)}
                        - Rentabilidad: ${Utils.numero(rentabilidad.rentabilidad_porcentaje, 1)}%
                        ` : '- No disponible'}
                        
                        LOTES ACTIVOS: ${lotes.length}
                        
                        ${lotes.map(l => `- ${l.codigo}: ${Utils.numero(l.area_mz, 1)} mz, ${l.variedad_nombre || 'Sin variedad'}`).join('\n')}
                        
                        ---
                        Generado por Cafetal OS v1.0
                    `;
                    break;

                case 'lotes':
                    titulo = 'Rendimiento por Lote';
                    contenido = `
                        Rendimiento por Lote - ${año}
                        
                        ${rendLotes.map(r => `- ${r.codigo}: ${Utils.numero(r.rend_promedio, 1)}% promedio, ${r.procesos} procesos, ${Utils.numero(r.total_pergamino, 0)} kg pergamino`).join('\n')}
                    `;
                    break;

                case 'costos':
                    const gastos = await window.api.gastos.resumen(`${año}-01-01`, Utils.hoy());
                    titulo = 'Estado de Costos';
                    contenido = `
                        Estado de Costos - ${año}
                        
                        Total: ${Utils.moneda(gastosTotal.total)}
                        
                        ${gastos.map(g => `- ${g.categoria}: ${Utils.moneda(g.total)}`).join('\n')}
                    `;
                    break;

                case 'inventario':
                    const inv = await window.api.inventario.getResumen();
                    const labelsMap = {
                        'cereza': 'Cereza', 'pergamino_humedo': 'Pergamino Húmedo',
                        'pergamino_seco': 'Pergamino Seco', 'verde': 'Verde', 'tostado': 'Tostado'
                    };
                    titulo = 'Inventario Completo';
                    contenido = `
                        Inventario de Existencias - ${año}
                        
                        ${inv.map(i => `- ${labelsMap[i.tipo_producto] || i.tipo_producto}: ${Utils.numero(i.existencias_qq, 1)} qq`).join('\n')}
                    `;
                    break;

                case 'huella': {
                    const emisiones = await window.api.huella.getAll();
                    const total = await window.api.huella.getTotal();
                    const labels = { fertilizante: 'Fertilizante', combustible: 'Combustible', energia: 'Energía', transporte: 'Transporte', otros: 'Otros' };
                    titulo = 'Reporte de Huella de Carbono';
                    contenido = `
                        Reporte de Huella de Carbono - Cafetal OS
                        
                        TOTAL: ${Utils.numero(total.total_co2e || 0, 1)} kg CO₂e
                        Registros: ${total.registros || 0}
                        
                        DETALLE POR EMISIÓN:
                        ${emisiones.map(e => `- [${e.fecha}] ${labels[e.tipo_emision] || e.tipo_emision}: ${Utils.numero(e.cantidad_kg, 1)} kg → ${Utils.numero(e.co2e_kg, 1)} kg CO₂e (Lote: ${e.lote_codigo || 'General'})`).join('\n')}
                        
                        ---
                        Generado por Cafetal OS v1.0
                    `;
                    break;
                }
            }

            const result = await window.api.exportar.pdf({ tipo, titulo, contenidoHtml: contenido });
            if (result) {
                Utils.toast(`✅ PDF guardado: ${result}`);
            }
        } catch (err) {
            Utils.toast('❌ Error al exportar PDF: ' + err.message, 'error');
        }
    },

    // ─── Exportar Excel ───
    async exportarExcel(tipo) {
        try {
            let titulo, columnas, datos;
            const año = Utils.añoActual();
            const labelsMap = {
                'cereza': 'Cereza', 'pergamino_humedo': 'Pergamino Húmedo',
                'pergamino_seco': 'Pergamino Seco', 'verde': 'Verde', 'tostado': 'Tostado'
            };

            switch(tipo) {
                case 'temporada': {
                    const lotes = await window.api.lotes.getAll();
                    titulo = `Lotes_${año}`;
                    columnas = [
                        { label: 'Código', key: 'codigo' },
                        { label: 'Área (mz)', key: 'area_mz' },
                        { label: 'Variedad', key: 'variedad' },
                        { label: 'Estado', key: 'estado' },
                        { label: 'Total Latas', key: 'latas' }
                    ];
                    datos = lotes.map(l => ({
                        codigo: l.codigo,
                        area_mz: l.area_mz,
                        variedad: l.variedad_nombre || '',
                        estado: l.estado,
                        latas: l.total_latas || 0
                    }));
                    break;
                }
                case 'inventario': {
                    const inv = await window.api.inventario.getResumen();
                    titulo = 'Inventario';
                    columnas = [
                        { label: 'Producto', key: 'producto' },
                        { label: 'Existencias (qq)', key: 'qq' },
                        { label: 'Existencias (kg)', key: 'kg' }
                    ];
                    datos = inv.map(i => ({
                        producto: labelsMap[i.tipo_producto] || i.tipo_producto,
                        qq: i.existencias_qq,
                        kg: i.existencias_qq * 46
                    }));
                    break;
                }
                // ★ FLUJO 4: Exportar ranking de recolectores
                case 'ranking': {
                    const ranking = await window.api.recolectores.getRanking(`${año}-01-01`, Utils.hoy(), 100);
                    titulo = `Ranking_Recolectores_${año}`;
                    columnas = [
                        { label: 'Nombre', key: 'nombre' },
                        { label: 'Cortes', key: 'cortes' },
                        { label: 'Latas', key: 'latas' },
                        { label: 'Kilos', key: 'kilos' },
                        { label: 'Total Pagado', key: 'pagado' }
                    ];
                    datos = ranking.map(r => ({
                        nombre: r.nombre_completo,
                        cortes: r.total_cortes,
                        latas: r.total_latas,
                        kilos: r.total_kilos,
                        pagado: r.total_pagado
                    }));
                    break;
                }
                // ★ FLUJO 5: Exportar rentabilidad
                case 'rentabilidad': {
                    const rent = await window.api.dashboard.getRentabilidad(año);
                    titulo = `Rentabilidad_${año}`;
                    columnas = [
                        { label: 'Indicador', key: 'indicador' },
                        { label: 'Valor (L)', key: 'valor' }
                    ];
                    datos = [
                        { indicador: 'Ingresos por Ventas', valor: rent.total_ingresos },
                        { indicador: 'Costos - Gastos', valor: rent.costos_gastos },
                        { indicador: 'Costos - Cosecha (recolectores)', valor: rent.costos_cosecha },
                        { indicador: 'Costos Totales', valor: rent.costos_totales },
                        { indicador: 'Utilidad', valor: rent.utilidad },
                        { indicador: 'Rentabilidad (%)', valor: rent.rentabilidad_porcentaje }
                    ];
                    break;
                }
                default: {
                    const cosecha = await window.api.cosecha.getLastDays(30);
                    titulo = 'Cosecha_Reciente';
                    columnas = [
                        { label: 'Fecha', key: 'fecha' },
                        { label: 'Latas', key: 'latas' },
                        { label: 'Kilos', key: 'kilos' }
                    ];
                    datos = cosecha.map(c => ({
                        fecha: c.fecha,
                        latas: c.latas,
                        kilos: c.kilos
                    }));
                }
            }

            const result = await window.api.exportar.excel({ titulo, columnas, datos });
            if (result) {
                Utils.toast(`✅ Excel guardado: ${result}`);
            }
        } catch (err) {
            Utils.toast('❌ Error al exportar Excel: ' + err.message, 'error');
        }
    }
};

window.Reportes = Reportes;
