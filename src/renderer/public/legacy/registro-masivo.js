// ─── Cafetal OS — Registro masivo y planillas semanales ───
const RegistroMasivo = {
    currentModule: null,
    entity: null,
    definitions: {},
    rows: [],
    catalogs: {},
    planillaData: null,

    async enhance(container, moduleId) {
        const config = this.moduleConfig(moduleId);
        if (!config || !container) return;
        const header = container.querySelector('.page-header');
        if (!header || header.querySelector('[data-bulk-action]')) return;
        let actions = header.querySelector('.page-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.className = 'page-actions';
            const existingButtons = [...header.children].filter(child => child.matches?.('button,.btn'));
            existingButtons.forEach(button => actions.appendChild(button));
            header.appendChild(actions);
        }
        if (moduleId === 'cosecha') {
            const weekly = document.createElement('button');
            weekly.type = 'button'; weekly.className = 'btn btn-primary weekly-register-button'; weekly.dataset.bulkAction = 'weekly';
            weekly.innerHTML = ' Planilla semanal'; weekly.onclick = () => this.openWeekly();
            actions.prepend(weekly);
        }
        if (moduleId === 'compras') {
            const providers = document.createElement('button');
            providers.type = 'button'; providers.className = 'btn btn-outline mass-register-button'; providers.dataset.bulkAction = 'providers';
            providers.innerHTML = ' Proveedores masivos'; providers.onclick = () => this.open('compras', 'proveedor_cafe');
            actions.prepend(providers);
        }
        const bulk = document.createElement('button');
        bulk.type = 'button'; bulk.className = 'btn btn-outline mass-register-button'; bulk.dataset.bulkAction = 'bulk';
        bulk.innerHTML = ` ${config.button || 'Registro masivo'}`;
        bulk.onclick = () => this.open(moduleId, config.entity);
        actions.prepend(bulk);
        if (moduleId === 'cosecha') await this.renderPlanillaInsights(container);
    },

    async renderPlanillaInsights(container) {
        if (container.querySelector('#planilla-profitability-card')) return;
        try {
            const rows = await window.api.planillas.getProfitability(8);
            if (!rows?.length) return;
            const pageBody = container.querySelector('.page-body');
            if (!pageBody) return;
            const section = document.createElement('section');
            section.id = 'planilla-profitability-card'; section.className = 'card planilla-profitability-card';
            section.innerHTML = `<div class="card-header responsive-card-header"><div><h3>📊 Seguimiento por semana de corte</h3><p>Costos directos, transformación y margen de referencia por lote. Los valores marcados como estimados usan ventanas posteriores a la semana.</p></div><button class="btn btn-outline" onclick="RegistroMasivo.openWeekly()">Abrir planilla</button></div><div class="card-body"><div class="table-container"><table><thead><tr><th>Semana</th><th>Lote</th><th>Cortadores</th><th>Cereza</th><th>Pago corte</th><th>Pergamino</th><th>Rend.</th><th>Costo directo</th><th>Margen estimado</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${Utils.fecha(row.semana_inicio)}</td><td><strong>${Utils.escapar(row.lote_codigo)}</strong><small class="table-secondary">${Utils.escapar(row.temporada_nombre||'Sin temporada')}</small></td><td>${row.cortadores}</td><td>${Utils.numero(row.kilos_cereza,1)} kg</td><td>${Utils.moneda(row.pago_cortadores)}</td><td>${Utils.numero(row.kilos_pergamino,1)} kg</td><td>${Utils.numero(row.rendimiento_estimado,1)}%</td><td>${Utils.moneda(row.costo_directo_estimado)}</td><td>${row.margen_estimado==null?'<span class="status-pill pendiente">Pendiente de venta</span>':`<strong>${Utils.moneda(row.margen_estimado)}</strong><small class="table-secondary">estimado</small>`}</td></tr>`).join('')}</tbody></table></div><p class="weekly-note">Estos indicadores sirven para detectar semanas costosas o con bajo rendimiento. Para rentabilidad contable exacta, vincule las salidas y ventas con su lote de origen y revise el reporte financiero.</p></div>`;
            pageBody.prepend(section);
        } catch (error) { console.warn('No se pudo cargar el seguimiento de planillas:', error); }
    },

    moduleConfig(moduleId) {
        return {
            finca: { entity: 'lote', button: 'Planificar lotes' },
            lotes: { entity: 'lote', button: 'Registro masivo' },
            cosecha: { entity: 'cosecha', button: 'Cortes por filas' },
            beneficio: { entity: 'beneficio', button: 'Procesos masivos' },
            inventario: { entity: 'inventario', button: 'Movimientos masivos' },
            gastos: { entity: 'gasto', button: 'Gastos masivos' },
            compras: { entity: 'compra_cafe', button: 'Compras masivas' },
            clima: { entity: 'clima', button: 'Clima masivo' },
            calidad: { entity: 'calidad', button: 'Cataciones masivas' }
        }[moduleId];
    },

    async loadCatalogs() {
        const [lots, varieties, pickers, providers] = await Promise.all([
            window.api.lotes.getAll(), window.api.variedades.getAll(), window.api.recolectores.getAll(), window.api.proveedoresCafe?.getAll?.() || []
        ]);
        this.catalogs = { lots, varieties, pickers, providers };
    },

    fieldDefinitions(entity) {
        const opts = (items, value = 'id', label = 'nombre') => items.map(item => ({ value: item[value], label: item[label] }));
        const productOptions = [
            { value: 'cereza', label: 'Cereza' }, { value: 'pergamino_humedo', label: 'Pergamino húmedo' },
            { value: 'pergamino_seco', label: 'Pergamino seco' }, { value: 'verde', label: 'Verde / oro' }, { value: 'tostado', label: 'Tostado' }
        ];
        return {
            lote: {
                title: 'Registro masivo de lotes', help: 'Agregue una fila por parcela. Los códigos y el área total se validan antes de guardar todo el bloque.',
                fields: [
                    { key: 'codigo', label: 'Código *', type: 'text', width: 130 }, { key: 'area_mz', label: 'Área mz *', type: 'number', step: '0.01', width: 105 },
                    { key: 'variedad_id', label: 'Variedad', type: 'select', options: opts(this.catalogs.varieties), width: 170 },
                    { key: 'año_siembra', label: 'Año siembra', type: 'number', width: 110 }, { key: 'densidad_plantas_mz', label: 'Plantas/mz', type: 'number', width: 115 },
                    { key: 'altitud_lote_msnm', label: 'Altitud', type: 'number', width: 100 },
                    { key: 'exposicion', label: 'Exposición', type: 'select', options: ['Norte','Sur','Este','Oeste','Plano'].map(v => ({ value:v,label:v })), width: 120 },
                    { key: 'tipo_suelo', label: 'Suelo', type: 'select', options: ['Franco','Franco arenoso','Franco arcilloso','Arcilloso','Arenoso','Limoso'].map(v => ({ value:v,label:v })), width: 150 },
                    { key: 'estado', label: 'Estado', type: 'select', default: 'produccion', options: [{value:'produccion',label:'Producción'},{value:'reposicion',label:'Reposición'},{value:'descanso',label:'Descanso'},{value:'nuevo',label:'Nuevo'}], width: 125 },
                    { key: 'observaciones', label: 'Observaciones', type: 'text', width: 220 }
                ]
            },
            recolector: {
                title: 'Registro masivo de cortadores', help: 'Cree la cuadrilla antes de llenar la planilla semanal.',
                fields: [{key:'nombre_completo',label:'Nombre completo *',type:'text',width:240},{key:'identificacion',label:'Identificación',type:'text',width:160},{key:'telefono',label:'Teléfono',type:'text',width:140}]
            },
            cosecha: {
                title: 'Registro masivo de cortes', help: 'Una fila representa el corte de una persona en una fecha y lote. Para trabajo semanal use Planilla semanal.',
                fields: [
                    {key:'fecha',label:'Fecha *',type:'date',default:Utils.hoy(),width:135},{key:'lote_id',label:'Lote *',type:'select',options:opts(this.catalogs.lots,'id','codigo'),width:130},
                    {key:'recolector_id',label:'Cortador',type:'select',options:opts(this.catalogs.pickers,'id','nombre_completo'),width:200},
                    {key:'latas_recolectadas',label:'Latas *',type:'number',step:'0.01',width:100},{key:'peso_lata_kg',label:'kg/lata',type:'number',step:'0.1',default:18,width:90},
                    {key:'precio_por_lata',label:'L/lata',type:'number',step:'0.01',width:100},{key:'tipo_madurez',label:'Madurez',type:'select',default:'maduro',options:['maduro','verde','pinton','sobremaduro','mixto'].map(v=>({value:v,label:v})),width:120},
                    {key:'observaciones',label:'Observaciones',type:'text',width:220}
                ]
            },
            beneficio: {
                title: 'Registro masivo de beneficio', help: 'Cada fila genera un proceso y una entrada automática de pergamino seco al inventario.',
                fields: [
                    {key:'lote_id',label:'Lote *',type:'select',options:opts(this.catalogs.lots,'id','codigo'),width:125},{key:'fecha_inicio',label:'Inicio *',type:'date',default:Utils.hoy(),width:130},{key:'fecha_fin',label:'Final',type:'date',default:Utils.hoy(),width:130},
                    {key:'kilos_cereza_ingresados',label:'kg cereza *',type:'number',step:'0.1',width:115},{key:'kilos_pergamino_seco',label:'kg pergamino *',type:'number',step:'0.1',width:130},
                    {key:'metodo',label:'Método',type:'select',default:'lavado',options:['lavado','honey','natural','semi-lavado'].map(v=>({value:v,label:v})),width:120},{key:'horas_fermentacion',label:'Fermentación h',type:'number',step:'0.5',width:125},
                    {key:'tipo_secado',label:'Secado',type:'select',default:'sol',options:['sol','mecanico','combinado','silo'].map(v=>({value:v,label:v})),width:120},{key:'dias_secado',label:'Días',type:'number',width:80},{key:'humedad_final_porcentaje',label:'Humedad %',type:'number',step:'0.1',width:105},{key:'observaciones',label:'Observaciones',type:'text',width:220}
                ]
            },
            inventario: {
                title: 'Movimientos masivos de inventario', help: 'Las salidas y ventas se validan contra las existencias disponibles.',
                fields: [
                    {key:'fecha_movimiento',label:'Fecha *',type:'date',default:Utils.hoy(),width:130},{key:'tipo_producto',label:'Producto *',type:'select',options:productOptions,width:165},{key:'tipo_movimiento',label:'Movimiento *',type:'select',default:'entrada',options:['entrada','salida','venta'].map(v=>({value:v,label:v})),width:120},
                    {key:'cantidad_qq',label:'Cantidad qq *',type:'number',step:'0.01',width:115},{key:'lote_id',label:'Lote',type:'select',options:opts(this.catalogs.lots,'id','codigo'),width:120},{key:'ubicacion',label:'Ubicación',type:'text',width:160},{key:'cliente_destino',label:'Cliente',type:'text',width:180},{key:'precio_venta_qq',label:'Precio/qq',type:'number',step:'0.01',width:110},{key:'factura',label:'Factura',type:'text',width:120},{key:'observaciones',label:'Observaciones',type:'text',width:220}
                ]
            },
            gasto: {
                title: 'Registro masivo de gastos', help: 'El costo total se calcula como cantidad × costo unitario antes de guardar.',
                fields: [
                    {key:'fecha',label:'Fecha *',type:'date',default:Utils.hoy(),width:130},{key:'lote_id',label:'Lote',type:'select',options:opts(this.catalogs.lots,'id','codigo'),width:120},{key:'categoria',label:'Categoría *',type:'select',options:['fertilizante','fungicida','herbicida','mano_obra','transporte','insumos','maquinaria','mantenimiento','servicios','otros'].map(v=>({value:v,label:v.replace('_',' ')})),width:150},
                    {key:'descripcion',label:'Descripción *',type:'text',width:240},{key:'cantidad',label:'Cantidad',type:'number',step:'0.01',default:1,width:95},{key:'unidad_medida',label:'Unidad',type:'text',width:110},{key:'costo_unitario',label:'Costo unitario',type:'number',step:'0.01',width:120},{key:'costo_total',label:'Costo total',type:'number',step:'0.01',width:120},{key:'proveedor',label:'Proveedor',type:'text',width:170},{key:'factura_comprobante',label:'Comprobante',type:'text',width:140}
                ]
            },
            proveedor_cafe: {
                title: 'Registro masivo de proveedores de café', help: 'Cree productores, cooperativas, intermediarios o beneficios. El código es opcional y Cafetal OS lo genera si se deja vacío.',
                fields: [
                    {key:'codigo',label:'Código',type:'text',width:135},{key:'nombre',label:'Nombre *',type:'text',width:240},
                    {key:'tipo',label:'Tipo *',type:'select',default:'productor',options:[['productor','Productor'],['intermediario','Intermediario'],['cooperativa','Cooperativa'],['beneficio','Beneficio'],['exportador','Exportador'],['otro','Otro']].map(([value,label])=>({value,label})),width:150},
                    {key:'identificacion',label:'RTN / identidad',type:'text',width:160},{key:'telefono',label:'Teléfono',type:'text',width:140},
                    {key:'email',label:'Correo',type:'email',width:210},{key:'ubicacion',label:'Ubicación',type:'text',width:220},{key:'certificaciones',label:'Certificaciones',type:'text',width:220}
                ]
            },
            compra_cafe: {
                title: 'Compras masivas de café', help: 'Use códigos únicos y registre siempre el peso. Las filas quedan pendientes de calidad salvo que seleccione otro estado.',
                fields: [
                    {key:'codigo',label:'Código *',type:'text',width:150},{key:'fecha',label:'Fecha *',type:'date',default:Utils.hoy(),width:130},{key:'proveedor_id',label:'Proveedor *',type:'select',options:opts(this.catalogs.providers),width:200},{key:'tipo_producto',label:'Producto *',type:'select',options:productOptions,width:165},
                    {key:'cantidad_kg',label:'kg *',type:'number',step:'0.01',width:100},{key:'precio_por_kg',label:'L/kg *',type:'number',step:'0.01',width:105},{key:'humedad_porcentaje',label:'Humedad %',type:'number',step:'0.1',width:105},{key:'defectos_porcentaje',label:'Defectos %',type:'number',step:'0.1',width:105},
                    {key:'estado_calidad',label:'Calidad',type:'select',default:'pendiente',options:['pendiente','aprobado','condicionado','rechazado'].map(v=>({value:v,label:v})),width:125},{key:'temporada',label:'Temporada',type:'text',width:115},{key:'finca_origen',label:'Finca origen',type:'text',width:180},{key:'origen_geografico',label:'Origen geográfico',type:'text',width:190},{key:'lote_proveedor',label:'Lote proveedor',type:'text',width:140}
                ]
            },
            clima: {
                title: 'Registros climáticos masivos', help: 'Agregue mediciones por fecha y lote para construir historial y alertas.',
                fields: [{key:'fecha',label:'Fecha *',type:'date',default:Utils.hoy(),width:130},{key:'precipitacion_mm',label:'Lluvia mm',type:'number',step:'0.1',width:110},{key:'temp_max',label:'T. máxima',type:'number',step:'0.1',width:105},{key:'temp_min',label:'T. mínima',type:'number',step:'0.1',width:105},{key:'humedad_relativa',label:'Humedad %',type:'number',step:'0.1',width:105},{key:'velocidad_viento',label:'Viento km/h',type:'number',step:'0.1',width:115},{key:'fuente',label:'Fuente',type:'text',default:'manual',width:150},{key:'notas',label:'Notas',type:'text',width:240}]
            },
            calidad: {
                title: 'Cataciones masivas', help: 'Cada fila calcula el puntaje a partir de sus componentes y conserva evaluador y notas.',
                fields: [{key:'fecha',label:'Fecha *',type:'date',default:Utils.hoy(),width:130},{key:'lote_id',label:'Lote *',type:'select',options:opts(this.catalogs.lots,'id','codigo'),width:120},{key:'evaluador',label:'Evaluador *',type:'text',width:170},...['fragancia','sabor','acidez','cuerpo','uniformidad','taza_limpia','dulzor'].map(key=>({key,label:key.replace('_',' '),type:'number',step:'0.1',default:['uniformidad','taza_limpia','dulzor'].includes(key)?10:'',width:105})),{key:'notas_catacion',label:'Notas',type:'text',width:240}]
            }
        }[entity];
    },

    emptyRow(definition) {
        return Object.fromEntries(definition.fields.map(field => [field.key, field.default ?? '']));
    },

    async open(moduleId, entity) {
        await this.loadCatalogs();
        this.currentModule = moduleId; this.entity = entity; this.definition = this.fieldDefinitions(entity);
        if (!this.definition) throw new Error(`No existe una definición de registro masivo para ${entity}.`);
        this.rows = Array.from({ length: ['recolector','proveedor_cafe'].includes(entity) ? 12 : 8 }, () => this.emptyRow(this.definition));
        this.ensureBulkModal(); this.renderBulk(); Utils.mostrarModal('modal-registro-masivo');
    },

    ensureBulkModal() {
        if (document.getElementById('modal-registro-masivo')) return;
        const modal = document.createElement('div'); modal.id = 'modal-registro-masivo'; modal.className = 'modal-overlay bulk-modal-overlay';
        modal.innerHTML = `<div class="modal-content bulk-modal-content"><div class="modal-header"><div><h3 id="bulk-title">Registro masivo</h3><p id="bulk-help"></p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-registro-masivo')">×</button></div><div class="bulk-toolbar"><button class="btn btn-outline" onclick="RegistroMasivo.addRow()">+ Fila</button><button class="btn btn-outline" onclick="RegistroMasivo.addRows(10)">+ 10 filas</button><button class="btn btn-outline bulk-paste-trigger" onclick="RegistroMasivo.openPaste()">📋 Pegar desde Excel</button><button class="btn btn-outline" onclick="RegistroMasivo.validate()">✓ Validar</button><span id="bulk-status" class="bulk-status">Sin validar</span></div><div class="modal-body bulk-body"><div id="bulk-table"></div><section id="bulk-paste" class="bulk-paste-panel" hidden><div class="bulk-paste-heading"><div><span class="bulk-step">Importación tabulada</span><h4>Pegar filas desde Excel o Google Sheets</h4><p>Copie las celdas sin combinarlas. Cafetal OS reconocerá encabezados iguales a los campos visibles y convertirá listas como proveedor, lote o estado.</p></div><button type="button" class="btn btn-outline" onclick="RegistroMasivo.copyPasteHeaders()">Copiar encabezados</button></div><div id="bulk-paste-columns" class="bulk-paste-columns"></div><label for="bulk-paste-text">Datos copiados</label><textarea id="bulk-paste-text" rows="14" spellcheck="false" placeholder="Ejemplo:
Código	Fecha	Proveedor	Producto	Cantidad kg
CMP-001	2026-07-21	Finca La Esperanza	Pergamino seco	460"></textarea><div class="bulk-paste-actions"><button class="btn btn-outline" onclick="RegistroMasivo.cancelPaste()">Volver a la tabla</button><button class="btn btn-primary" onclick="RegistroMasivo.applyPaste()">Aplicar datos a la tabla</button></div></section></div><div class="modal-footer"><span id="bulk-summary"></span><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-registro-masivo')">Cancelar</button><button class="btn btn-primary" onclick="RegistroMasivo.save()">💾 Guardar todos</button></div></div>`;
        document.body.appendChild(modal);
    },

    renderBulk(validation = null) {
        document.getElementById('bulk-title').textContent = this.definition.title;
        document.getElementById('bulk-help').textContent = this.definition.help;
        const table = `<div class="bulk-table-wrap"><table class="bulk-table"><thead><tr><th class="row-index">#</th>${this.definition.fields.map(field=>`<th style="min-width:${field.width||120}px">${field.label}</th>`).join('')}<th></th></tr></thead><tbody>${this.rows.map((row,index)=>this.renderRow(row,index,validation?.find(item=>item.index===index))).join('')}</tbody></table></div>`;
        document.getElementById('bulk-table').innerHTML = table;
        document.getElementById('bulk-summary').textContent = `${this.rows.length} filas disponibles`;
    },

    renderRow(row, index, validation) {
        const invalid = validation && !validation.valid;
        return `<tr data-row="${index}" class="${invalid?'bulk-row-invalid':''}"><td class="row-index"><strong>${index+1}</strong>${invalid?`<span title="${Utils.escapar(validation.errors.join(' · '))}">!</span>`:''}</td>${this.definition.fields.map(field=>`<td>${this.renderInput(field,row[field.key],index)}</td>`).join('')}<td><button class="btn-icon" title="Eliminar fila" onclick="RegistroMasivo.removeRow(${index})">🗑</button></td></tr>${invalid?`<tr class="bulk-error-row"><td></td><td colspan="${this.definition.fields.length+1}">${validation.errors.map(Utils.escapar).join(' · ')}</td></tr>`:''}`;
    },

    renderInput(field, value, rowIndex) {
        const common = `data-row="${rowIndex}" data-key="${field.key}" onchange="RegistroMasivo.updateCell(this)" oninput="RegistroMasivo.updateCell(this)"`;
        if (field.type === 'select') return `<select class="bulk-input" ${common}><option value="">Seleccionar…</option>${(field.options||[]).map(opt=>`<option value="${opt.value}" ${String(opt.value)===String(value)?'selected':''}>${Utils.escapar(opt.label)}</option>`).join('')}</select>`;
        return `<input class="bulk-input" type="${field.type||'text'}" value="${Utils.escapar(value)}" ${field.step?`step="${field.step}"`:''} ${common}/>`;
    },

    updateCell(input) { this.rows[Number(input.dataset.row)][input.dataset.key] = input.value; document.getElementById('bulk-status').textContent = 'Cambios sin validar'; },
    addRow() { this.rows.push(this.emptyRow(this.definition)); this.renderBulk(); },
    addRows(count) { for(let i=0;i<count;i++) this.rows.push(this.emptyRow(this.definition)); this.renderBulk(); },
    removeRow(index) { this.rows.splice(index,1); if(!this.rows.length) this.addRow(); else this.renderBulk(); },
    openPaste() {
        const panel = document.getElementById('bulk-paste');
        const table = document.getElementById('bulk-table');
        const columns = document.getElementById('bulk-paste-columns');
        if (!panel || !table) return;
        panel.hidden = false;
        table.hidden = true;
        if (columns) columns.innerHTML = this.definition.fields.map(field => `<span>${Utils.escapar(field.label.replace(/\s*\*/g,''))}</span>`).join('');
        window.setTimeout(() => document.getElementById('bulk-paste-text')?.focus(), 0);
    },
    async copyPasteHeaders() {
        const headers = this.definition.fields.map(field => field.label.replace(/\s*\*/g,'').trim()).join('\t');
        try { await navigator.clipboard.writeText(headers); Utils.toast('Encabezados copiados.'); }
        catch (_error) { const textarea=document.getElementById('bulk-paste-text'); if(textarea){ textarea.value=headers+'\n'; textarea.focus(); textarea.select(); } }
    },
    cancelPaste() { document.getElementById('bulk-paste').hidden=true; document.getElementById('bulk-table').hidden=false; },
    applyPaste() {
        const textarea = document.getElementById('bulk-paste-text');
        const text = textarea?.value.trim();
        if (!text) { Utils.toast('Pegue al menos una fila desde Excel.', 'error'); return; }
        const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();
        const matrix = text.split(/\r?\n/).filter(line => line.trim()).map(line => line.split('\t'));
        const fieldDescriptors = this.definition.fields.map(field => ({ field, key: normalize(field.key), label: normalize(field.label.replace(/\s*\*/g,'')) }));
        const first = matrix[0].map(normalize);
        const headerMatches = first.map(value => fieldDescriptors.find(item => item.key === value || item.label === value)?.field || null);
        const hasHeader = headerMatches.filter(Boolean).length >= Math.min(2, this.definition.fields.length);
        const columnFields = hasHeader ? headerMatches : this.definition.fields;
        if (hasHeader) matrix.shift();
        const imported = matrix.map(values => {
            const row = this.emptyRow(this.definition);
            values.forEach((value, index) => {
                const field = columnFields[index];
                if (!field) return;
                const raw = value.trim();
                if (field.type === 'select') {
                    const normalizedRaw = normalize(raw);
                    const match = (field.options || []).find(option => normalize(option.value) === normalizedRaw || normalize(option.label) === normalizedRaw);
                    row[field.key] = match?.value ?? raw;
                } else row[field.key] = raw;
            });
            return row;
        }).filter(row => Object.values(row).some(value => String(value ?? '').trim() !== ''));
        if (!imported.length) { Utils.toast('No se detectaron filas utilizables.', 'error'); return; }
        this.rows = imported;
        this.cancelPaste();
        this.renderBulk();
        textarea.value = '';
        document.getElementById('bulk-status').textContent = `${imported.length} filas importadas; valide antes de guardar`;
        Utils.toast(`${imported.length} filas importadas desde la tabla.`);
    },

    effectiveRows() { return this.rows.filter(row=>Object.values(row).some(value=>String(value??'').trim()!=='')); },
    async validate() {
        const rows=this.effectiveRows(); if(!rows.length){ Utils.toast('No hay filas con información.','error'); return null; }
        const validation=await window.api.bulk.validate(this.entity,rows); this.rows=rows; this.renderBulk(validation);
        const invalid=validation.filter(row=>!row.valid).length; const status=document.getElementById('bulk-status'); status.textContent=invalid?`${invalid} filas con errores`:`${validation.length} filas listas`; status.className=`bulk-status ${invalid?'error':'success'}`; return validation;
    },
    async save() {
        try {
            const result=await window.api.bulk.save(this.entity,this.effectiveRows());
            if(!result.ok){ this.rows=this.effectiveRows(); this.renderBulk(result.validation); document.getElementById('bulk-status').textContent='Corrija las filas marcadas'; document.getElementById('bulk-status').className='bulk-status error'; return; }
            Utils.toast(`✅ ${result.count} registros guardados en una sola operación.`); Utils.cerrarModal('modal-registro-masivo'); App.cargarPagina(this.currentModule);
        } catch(error){ Utils.toast(`❌ ${error.message}`,'error'); }
    },

    // ─── Planilla semanal ───
    async openWeekly() {
        try {
            await this.loadCatalogs();
            this.ensureWeeklyModal();
            Utils.mostrarModal('modal-planilla-semanal');
            const emptyHost = document.getElementById('weekly-table');
            if (emptyHost) emptyHost.innerHTML = '<div class="weekly-loading">Cargando cortadores y planillas…</div>';
            if (!this.catalogs.pickers.length) {
                if (emptyHost) emptyHost.innerHTML = '<div class="weekly-empty"><strong>No hay cortadores registrados.</strong><p>Use el botón “+ Cortadores” para agregarlos y vuelva a abrir la planilla.</p></div>';
                document.getElementById('weekly-summary').textContent = 'Se requieren cortadores activos';
                return;
            }
            const [config, existingPlans] = await Promise.all([window.api.config.getAll(), window.api.planillas.list()]);
            const today = new Date();
            const day = today.getDay();
            today.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
            const latest = existingPlans?.[0] || null;
            const defaultWeek = latest?.semana_inicio || today.toISOString().slice(0,10);
            Utils.setVal('planilla-semana', defaultWeek);
            Utils.setVal('planilla-dias', latest?.dias_semana || config.cosecha_dias_semana || '5');
            Utils.setVal('planilla-peso', latest?.peso_lata_kg || config.peso_lata_kg || '18');
            Utils.setVal('planilla-unidad', latest?.unidad || 'lata');
            Utils.setVal('planilla-precio', latest?.precio_por_unidad || 0);
            const lotSelect = document.getElementById('planilla-lote');
            const availableLots = this.catalogs.lots.filter(lot => !Number(lot.es_sistema || 0));
            lotSelect.innerHTML = '<option value="">Seleccionar lote…</option>' + availableLots.map(l => `<option value="${l.id}">${Utils.escapar(l.codigo)}</option>`).join('');
            if (latest?.lote_id && availableLots.some(l => Number(l.id) === Number(latest.lote_id))) lotSelect.value = latest.lote_id;
            else if (availableLots[0]) lotSelect.value = availableLots[0].id;
            await this.loadWeekly();
        } catch (error) {
            console.error('No se pudo abrir la planilla semanal:', error);
            const host = document.getElementById('weekly-table');
            if (host) host.innerHTML = `<div class="weekly-empty error"><strong>No se pudo cargar la planilla.</strong><p>${Utils.escapar(error.message)}</p></div>`;
            Utils.toast(`❌ ${error.message}`, 'error');
        }
    },

    ensureWeeklyModal() {
        if(document.getElementById('modal-planilla-semanal')) return;
        const modal=document.createElement('div'); modal.id='modal-planilla-semanal'; modal.className='modal-overlay bulk-modal-overlay';
        modal.innerHTML=`<div class="modal-content weekly-modal-content"><div class="modal-header"><div><h3>📅 Planilla semanal de cortadores</h3><p>Filas por persona y columnas por día. Los pagos, kilos y latas se calculan automáticamente.</p></div><button class="modal-close" onclick="Utils.cerrarModal('modal-planilla-semanal')">×</button></div><div class="weekly-toolbar"><label>Lote<select id="planilla-lote" class="form-control" onchange="RegistroMasivo.loadWeekly()"></select></label><label>Semana que inicia<input id="planilla-semana" type="date" class="form-control" onchange="RegistroMasivo.loadWeekly()"/></label><label>Días<select id="planilla-dias" class="form-control" onchange="RegistroMasivo.renderWeekly()"><option value="5">L-V</option><option value="6">L-S</option><option value="7">L-D</option></select></label><label>Unidad<select id="planilla-unidad" class="form-control" onchange="RegistroMasivo.renderWeekly()"><option value="lata">Lata</option><option value="kg">Kilogramo</option><option value="canasta">Canasta</option></select></label><label>Precio / unidad<input id="planilla-precio" type="number" min="0" step="0.01" class="form-control" value="0" oninput="RegistroMasivo.renderWeekly()"/></label><label>Peso kg/unidad<input id="planilla-peso" type="number" min="1" step="0.1" class="form-control" value="18" oninput="RegistroMasivo.renderWeekly()"/></label></div><div class="modal-body weekly-body"><div class="weekly-note">💡 Puede recorrer las celdas con Tab. Las cantidades en blanco o cero no generan registros. Guardar nuevamente la misma semana actualiza la planilla.</div><div id="weekly-table"></div></div><div class="modal-footer"><span id="weekly-summary"></span><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-planilla-semanal');RegistroMasivo.open('cosecha','recolector')">+ Cortadores</button><button class="btn btn-outline" onclick="Utils.cerrarModal('modal-planilla-semanal')">Cancelar</button><button class="btn btn-primary" onclick="RegistroMasivo.saveWeekly()">💾 Guardar semana</button></div></div>`;
        document.body.appendChild(modal);
    },

    async loadWeekly() {
        const lotId = Utils.getVal('planilla-lote');
        const weekStart = Utils.getVal('planilla-semana');
        if (!lotId || !weekStart) {
            this.planillaData = {};
            const host = document.getElementById('weekly-table');
            if (host) host.innerHTML = '<div class="weekly-empty"><strong>Seleccione un lote y una semana.</strong></div>';
            return;
        }
        try {
            const data = await window.api.planillas.getWeek({ loteId: Number(lotId), weekStart });
            this.planillaData = data || {};
            if (data?.weekStart && data.weekStart !== weekStart) Utils.setVal('planilla-semana', data.weekStart);
            if (data?.planilla) {
                Utils.setVal('planilla-dias', data.planilla.dias_semana);
                Utils.setVal('planilla-unidad', data.planilla.unidad);
                Utils.setVal('planilla-precio', data.planilla.precio_por_unidad);
                Utils.setVal('planilla-peso', data.planilla.peso_lata_kg);
            } else if (data?.season) {
                Utils.setVal('planilla-unidad', data.season.unidad_default || 'lata');
                Utils.setVal('planilla-precio', data.season.precio_unidad_default || 0);
                Utils.setVal('planilla-peso', data.season.peso_lata_kg || 18);
            }
            this.renderWeekly();
        } catch (error) {
            console.error('Error cargando planilla:', error);
            const host = document.getElementById('weekly-table');
            if (host) host.innerHTML = `<div class="weekly-empty error"><strong>No se pudo consultar la semana.</strong><p>${Utils.escapar(error.message)}</p></div>`;
            Utils.toast(`❌ ${error.message}`, 'error');
        }
    },

    localDate(dateText,add=0){ const d=new Date(`${dateText}T12:00:00`); const day=d.getDay(); d.setDate(d.getDate()+(day===0?-6:1-day)+add); return d; },
    renderWeekly() {
        const host=document.getElementById('weekly-table'); if(!host) return;
        const week=Utils.getVal('planilla-semana')||Utils.hoy(), days=Number(Utils.getVal('planilla-dias')||5), unit=Utils.getVal('planilla-unidad')||'lata', price=Number(Utils.getVal('planilla-precio')||0), weight=Number(Utils.getVal('planilla-peso')||18);
        const existing=new Map((this.planillaData?.entries||[]).map(item=>[`${item.recolector_id}-${item.fecha}`,item.cantidad_unidad??(unit==='kg'?item.kilos_estimados:item.latas_recolectadas)]));
        const dates=Array.from({length:days},(_,i)=>this.localDate(week,i));
        let totalQty=0,totalPay=0,totalKg=0;
        const body=this.catalogs.pickers.map((picker,rowIndex)=>{ let rowTotal=0; const cells=dates.map(date=>{ const key=`${picker.id}-${date.toISOString().slice(0,10)}`, value=existing.get(key)||''; rowTotal+=Number(value||0); return `<td><input class="weekly-cell" type="number" min="0" step="0.01" data-picker="${picker.id}" data-day="${date.toISOString().slice(0,10)}" value="${value}" oninput="RegistroMasivo.updateWeeklySummary()" aria-label="${Utils.escapar(picker.nombre_completo)} ${date.toLocaleDateString('es-HN')}"/></td>`; }).join(''); totalQty+=rowTotal; totalPay+=rowTotal*price; totalKg+=unit==='kg'?rowTotal:rowTotal*weight; return `<tr><th><strong>${Utils.escapar(picker.nombre_completo)}</strong><small>${Utils.escapar(picker.identificacion||'')}</small></th>${cells}<td class="weekly-total" data-row-total="${rowIndex}">${Utils.numero(rowTotal,2)}</td><td class="weekly-pay" data-row-pay="${rowIndex}">${Utils.moneda(rowTotal*price)}</td></tr>`; }).join('');
        host.innerHTML=`<div class="weekly-table-wrap"><table class="weekly-table"><thead><tr><th>Cortador</th>${dates.map(date=>`<th>${date.toLocaleDateString('es-HN',{weekday:'short'})}<small>${date.toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit'})}</small></th>`).join('')}<th>Total ${unit}</th><th>Pago</th></tr></thead><tbody>${body}</tbody></table></div>`;
        document.getElementById('weekly-summary').textContent=`${Utils.numero(totalQty,2)} ${unit} · ${Utils.numero(totalKg,1)} kg · ${Utils.moneda(totalPay)}`;
    },

    updateWeeklySummary() {
        const days=Number(Utils.getVal('planilla-dias')||5), unit=Utils.getVal('planilla-unidad')||'lata', price=Number(Utils.getVal('planilla-precio')||0), weight=Number(Utils.getVal('planilla-peso')||18); let grand=0;
        this.catalogs.pickers.forEach((picker,index)=>{ const inputs=[...document.querySelectorAll(`.weekly-cell[data-picker="${picker.id}"]`)].slice(0,days); const total=inputs.reduce((sum,input)=>sum+Number(input.value||0),0); grand+=total; const totalCell=document.querySelector(`[data-row-total="${index}"]`),payCell=document.querySelector(`[data-row-pay="${index}"]`); if(totalCell) totalCell.textContent=Utils.numero(total,2); if(payCell) payCell.textContent=Utils.moneda(total*price); });
        const kg=unit==='kg'?grand:grand*weight; document.getElementById('weekly-summary').textContent=`${Utils.numero(grand,2)} ${unit} · ${Utils.numero(kg,1)} kg · ${Utils.moneda(grand*price)}`;
    },

    async saveWeekly() {
        const loteId = Utils.getVal('planilla-lote');
        const weekStart = Utils.getVal('planilla-semana');
        if (!loteId || !weekStart) { Utils.toast('Seleccione lote y semana antes de guardar.', 'error'); return; }
        const rows = this.catalogs.pickers.map(picker => ({
            recolectorId: picker.id,
            name: picker.nombre_completo,
            values: [...document.querySelectorAll(`.weekly-cell[data-picker="${picker.id}"]`)].map(input => Number(input.value || 0))
        }));
        const total = rows.reduce((sum, row) => sum + row.values.reduce((rowSum, value) => rowSum + Number(value || 0), 0), 0);
        if (total <= 0) { Utils.toast('Ingrese al menos una cantidad de corte antes de guardar.', 'error'); return; }
        try {
            const result = await window.api.planillas.saveWeek({
                loteId, weekStart, days: Utils.getVal('planilla-dias'), unit: Utils.getVal('planilla-unidad'),
                price: Utils.getVal('planilla-precio'), weight: Utils.getVal('planilla-peso'), rows, status: 'confirmada'
            });
            Utils.toast(`✅ Semana guardada: ${result.registros} registros, ${Utils.numero(result.kilos,1)} kg.`);
            Utils.cerrarModal('modal-planilla-semanal');
            App.cargarPagina('cosecha');
        } catch (error) {
            console.error('No se pudo guardar la planilla:', error);
            Utils.toast(`❌ ${error.message}`, 'error');
        }
    }
};
window.RegistroMasivo=RegistroMasivo;
