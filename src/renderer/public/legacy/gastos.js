// ─── Módulo: Gastos ───

const Gastos = {
    categoriaLabels: {
        'fertilizante': 'Fertilizante',
        'fungicida': 'Fungicida',
        'herbicida': 'Herbicida',
        'mano_obra': 'Mano de Obra',
        'transporte': 'Transporte',
        'insumos': 'Insumos',
        'maquinaria': 'Maquinaria',
        'mantenimiento': 'Mantenimiento',
        'servicios': 'Servicios',
        'otros': 'Otros'
    },

    categoriaIconos: {
        'fertilizante': '🧪', 'fungicida': '🧴', 'herbicida': '🌿',
        'mano_obra': '👷', 'transporte': '🚚', 'insumos': '📦',
        'maquinaria': '⚙️', 'mantenimiento': '🔧', 'servicios': '💡', 'otros': '📌'
    },

    chart: null,

    async cargar(container) {
        try {
            const lotes = await window.api.lotes.getAll();
            const categorias = await window.api.gastos.getCategorias();
            
            // Fecha por defecto: este año
            const año = Utils.añoActual();
            const filtros = { fechaIni: `${año}-01-01`, fechaFin: Utils.hoy() };
            const gastos = await window.api.gastos.getAll(filtros);
            const resumen = await window.api.gastos.resumen(filtros.fechaIni, filtros.fechaFin);
            const total = await window.api.gastos.total(filtros.fechaIni, filtros.fechaFin);

            container.innerHTML = `
                <div class="page-header">
                    <h2>💰 Gastos / Costos de Producción</h2>
                    <button class="btn btn-success" onclick="Gastos.nuevo()">+ Nuevo Gasto</button>
                </div>
                <div class="page-body">
                    <div class="filters-bar">
                        <div class="form-group">
                            <label>Desde</label>
                            <input type="date" id="gastos-fecha-ini" class="form-control" value="${filtros.fechaIni}">
                        </div>
                        <div class="form-group">
                            <label>Hasta</label>
                            <input type="date" id="gastos-fecha-fin" class="form-control" value="${filtros.fechaFin}">
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="gastos-categoria" class="form-control">
                                <option value="">Todas</option>
                                ${categorias.map(c => `<option value="${c}">${this.categoriaLabels[c] || c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary" onclick="Gastos.filtrar()">🔍 Filtrar</button>
                        </div>
                    </div>

                    <div class="kpi-grid">
                        <div class="kpi-card kpi-red">
                            <div class="kpi-icon">💰</div>
                            <div class="kpi-value">${Utils.moneda(total.total)}</div>
                            <div class="kpi-label">Total ${año}</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-icon">📋</div>
                            <div class="kpi-value">${gastos.length}</div>
                            <div class="kpi-label">Registros</div>
                        </div>
                    </div>

                    <div class="dashboard-grid">
                        <div class="card">
                            <div class="card-header">📊 Gastos por Categoría</div>
                            <div class="card-body">
                                <div class="chart-container chart-container-sm">
                                    <canvas id="chartGastos"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">📋 Resumen por Categoría</div>
                            <div class="card-body">
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr><th>Categoría</th><th>Total</th><th>%</th></tr>
                                        </thead>
                                        <tbody>
                                            ${resumen.length === 0 ?
                                                '<tr><td colspan="3" class="text-center" style="padding:15px;color:var(--cafe-400);">Sin gastos en el período.</td></tr>' :
                                                resumen.map(r => `
                                                    <tr>
                                                        <td>${this.categoriaIconos[r.categoria] || '📌'} ${this.categoriaLabels[r.categoria] || r.categoria}</td>
                                                        <td><strong>${Utils.moneda(r.total)}</strong></td>
                                                        <td>${total.total > 0 ? Utils.numero((r.total / total.total) * 100, 1) + '%' : '0%'}</td>
                                                    </tr>
                                                `).join('')
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">📋 Detalle de Gastos</div>
                        <div class="card-body">
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Categoría</th>
                                            <th>Descripción</th>
                                            <th>Lote</th>
                                            <th>Cantidad</th>
                                            <th>C. Unitario</th>
                                            <th>Total</th>
                                            <th>Proveedor</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${gastos.length === 0 ?
                                            '<tr><td colspan="9" class="text-center" style="padding:30px;color:var(--cafe-400);">No hay gastos registrados en este período.</td></tr>' :
                                            gastos.map(g => `
                                                <tr>
                                                    <td>${Utils.formatearFecha(g.fecha)}</td>
                                                    <td>${this.categoriaIconos[g.categoria] || '📌'} ${this.categoriaLabels[g.categoria] || g.categoria}</td>
                                                    <td>${Utils.escapar(g.descripcion)}</td>
                                                    <td>${g.lote_codigo ? Utils.escapar(g.lote_codigo) : 'General'}</td>
                                                    <td>${g.cantidad ? Utils.numero(g.cantidad, 0) + ' ' + (g.unidad_medida || '') : '-'}</td>
                                                    <td>${g.costo_unitario ? Utils.moneda(g.costo_unitario) : '-'}</td>
                                                    <td><strong>${Utils.moneda(g.costo_total)}</strong></td>
                                                    <td>${Utils.escapar(g.proveedor || '-')}</td>
                                                    <td><button class="btn-icon" onclick="Gastos.eliminar(${g.id})" title="Eliminar">🗑️</button></td>
                                                </tr>
                                            `).join('')
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal Nuevo Gasto -->
                <div id="modal-gasto" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>💰 Nuevo Gasto</h3>
                            <button class="modal-close" onclick="Utils.cerrarModal('modal-gasto')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Categoría *</label>
                                    <select id="gasto-categoria" class="form-control">
                                        ${categorias.map(c => `<option value="${c}">${this.categoriaLabels[c] || c}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Fecha</label>
                                    <input type="date" id="gasto-fecha" class="form-control" value="${Utils.hoy()}">
                                </div>
                                <div class="form-group">
                                    <label>Lote (opcional)</label>
                                    <select id="gasto-lote" class="form-control">
                                        <option value="">General (sin lote)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Descripción *</label>
                                <input type="text" id="gasto-descripcion" class="form-control" placeholder="Ej: Fertilizante 15-15-15, 10 sacos">
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Cantidad</label>
                                    <input type="number" id="gasto-cantidad" class="form-control" step="0.1" 
                                        placeholder="Ej: 10" value="1" oninput="Gastos.calcular()">
                                </div>
                                <div class="form-group">
                                    <label>Unidad de Medida</label>
                                    <input type="text" id="gasto-unidad" class="form-control" placeholder="Sacos, jornales, litros">
                                </div>
                                <div class="form-group">
                                    <label>Costo Unitario (L) *</label>
                                    <input type="number" id="gosto-unitario" class="form-control" step="0.01"
                                        placeholder="Ej: 450" oninput="Gastos.calcular()">
                                </div>
                            </div>
                            <div class="form-row-3">
                                <div class="form-group">
                                    <label>Costo Total</label>
                                    <input type="text" id="gasto-total" class="form-control" readonly
                                        style="font-weight:700;color:var(--cafe-800);background:var(--cafe-50);">
                                </div>
                                <div class="form-group">
                                    <label>Proveedor</label>
                                    <input type="text" id="gasto-proveedor" class="form-control" placeholder="Nombre del proveedor">
                                </div>
                                <div class="form-group">
                                    <label>Factura / Comprobante</label>
                                    <input type="text" id="gasto-factura" class="form-control" placeholder="N° factura">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onclick="Utils.cerrarModal('modal-gasto')">Cancelar</button>
                            <button class="btn btn-primary" onclick="Gastos.guardar()">💾 Registrar Gasto</button>
                        </div>
                    </div>
                </div>
            `;

            // Cargar lotes
            const selectLote = document.getElementById('gasto-lote');
            lotes.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id;
                opt.textContent = l.codigo;
                selectLote.appendChild(opt);
            });

            // Gráfico
            this.cargarGrafico(resumen);

        } catch (err) {
            console.error('Error cargando gastos:', err);
            container.innerHTML = `<div class="page-body"><p>Error al cargar gastos.</p></div>`;
        }
    },

    calcular() {
        const cant = parseFloat(Utils.getVal('gasto-cantidad')) || 0;
        const pu = parseFloat(Utils.getVal('gosto-unitario')) || 0;
        document.getElementById('gasto-total').value = Utils.moneda(cant * pu);
    },

    cargarGrafico(resumen) {
        const canvas = document.getElementById('chartGastos');
        if (!canvas) return;
        
        if (this.chart) this.chart.destroy();

        const labels = resumen.map(r => this.categoriaLabels[r.categoria] || r.categoria);
        const data = resumen.map(r => r.total);
        const colors = ['#3E2723','#5D4037','#795548','#8D6E63','#A1887F','#2E7D32','#FF8F00','#C62828','#1565C0','#6A1B9A'];

        this.chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { font: { size: 11 } }
                    }
                }
            }
        });
    },

    async filtrar() {
        App.cargarPagina('gastos');
    },

    nuevo() {
        Utils.limpiarForm('modal-gasto');
        Validador.limpiarForm('modal-gasto');
        Utils.setVal('gasto-fecha', Utils.hoy());
        Utils.setVal('gasto-cantidad', 1);
        Utils.mostrarModal('modal-gasto');
    },

    async guardar() {
        // Validar campos del formulario
        const campos = {
            'gasto-descripcion': ['required'],
            'gosto-unitario': ['required', 'positive']
        };
        if (!Validador.validarForm(campos)) return;

        const descripcion = Utils.getVal('gasto-descripcion');
        const cantidad = parseFloat(Utils.getVal('gasto-cantidad')) || 0;
        const costoUnitario = parseFloat(Utils.getVal('gosto-unitario')) || 0;

        const data = {
            lote_id: Utils.getVal('gasto-lote') || null,
            fecha: Utils.getVal('gasto-fecha') || Utils.hoy(),
            categoria: Utils.getVal('gasto-categoria') || 'otros',
            descripcion: descripcion,
            cantidad: cantidad,
            unidad_medida: Utils.getVal('gasto-unidad'),
            costo_unitario: costoUnitario,
            proveedor: Utils.getVal('gasto-proveedor'),
            factura_comprobante: Utils.getVal('gasto-factura')
        };

        try {
            await window.api.gastos.create(data);
            Utils.toast('✅ Gasto registrado correctamente');
            Utils.cerrarModal('modal-gasto');
            App.cargarPagina('gastos');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    },

    async eliminar(id) {
        if (!await Utils.confirmar('¿Eliminar este gasto?')) return;
        try {
            await window.api.gastos.delete(id);
            Utils.toast('✅ Gasto eliminado');
            App.cargarPagina('gastos');
        } catch (err) {
            Utils.toast('❌ Error: ' + err.message, 'error');
        }
    }
};

window.Gastos = Gastos;
