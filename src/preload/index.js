const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Autenticación local
    auth: {
        login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
        getCurrent: () => ipcRenderer.invoke('auth:getCurrent'),
        logout: () => ipcRenderer.invoke('auth:logout'),
        listUsers: () => ipcRenderer.invoke('auth:listUsers'),
        createUser: (data) => ipcRenderer.invoke('auth:createUser', data),
        updateUser: (id, data) => ipcRenderer.invoke('auth:updateUser', id, data),
        changePassword: (data) => ipcRenderer.invoke('auth:changePassword', data)
    },
    // Finca
    finca: {
        get: () => ipcRenderer.invoke('finca:get'),
        update: (data) => ipcRenderer.invoke('finca:update', data)
    },
    // Variedades
    variedades: {
        getAll: () => ipcRenderer.invoke('variedades:getAll')
    },
    // Lotes
    lotes: {
        getAll: () => ipcRenderer.invoke('lotes:getAll'),
        getById: (id) => ipcRenderer.invoke('lotes:getById', id),
        create: (data) => ipcRenderer.invoke('lotes:create', data),
        update: (id, data) => ipcRenderer.invoke('lotes:update', id, data),
        delete: (id) => ipcRenderer.invoke('lotes:delete', id),
        getResumen: () => ipcRenderer.invoke('lotes:getResumen'),
        getHistorial: (id) => ipcRenderer.invoke('lotes:getHistorial', id)
    },
    // Recolectores
    recolectores: {
        getAll: () => ipcRenderer.invoke('recolectores:getAll'),
        create: (data) => ipcRenderer.invoke('recolectores:create', data),
        getRanking: (fi, ff, limite) => ipcRenderer.invoke('recolectores:getRanking', fi, ff, limite)
    },
    temporadas: {
        getAll: () => ipcRenderer.invoke('temporadas:getAll'),
        create: (data) => ipcRenderer.invoke('temporadas:create', data)
    },
    planillas: {
        getWeek: (options) => ipcRenderer.invoke('planillas:getWeek', options),
        list: () => ipcRenderer.invoke('planillas:list'),
        getProfitability: (limit) => ipcRenderer.invoke('planillas:getProfitability', limit),
        saveWeek: (payload) => ipcRenderer.invoke('planillas:saveWeek', payload)
    },
    // Cosecha
    cosecha: {
        getLatestDate: () => ipcRenderer.invoke('cosecha:getLatestDate'),
        getByDate: (fecha) => ipcRenderer.invoke('cosecha:getByDate', fecha),
        getByLote: (lote_id) => ipcRenderer.invoke('cosecha:getByLote', lote_id),
        create: (data) => ipcRenderer.invoke('cosecha:create', data),
        delete: (id) => ipcRenderer.invoke('cosecha:delete', id),
        getResumen: (fi, ff) => ipcRenderer.invoke('cosecha:getResumen', fi, ff),
        getLastDays: (days) => ipcRenderer.invoke('cosecha:getLastDays', days),
        getResumenPorPeriodo: (fi, ff) => ipcRenderer.invoke('cosecha:getResumenPorPeriodo', fi, ff)
    },
    proveedoresCafe: {
        getAll: () => ipcRenderer.invoke('proveedoresCafe:getAll'),
        create: (data) => ipcRenderer.invoke('proveedoresCafe:create', data)
    },
    comprasCafe: {
        getAll: (filters) => ipcRenderer.invoke('comprasCafe:getAll', filters),
        getSummary: () => ipcRenderer.invoke('comprasCafe:getSummary'),
        nextCode: () => ipcRenderer.invoke('comprasCafe:nextCode'),
        create: (data) => ipcRenderer.invoke('comprasCafe:create', data),
        setStatus: (id, status) => ipcRenderer.invoke('comprasCafe:setStatus', id, status),
        updateQuality: (id, data) => ipcRenderer.invoke('comprasCafe:updateQuality', id, data),
        sendToBenefit: (id, data) => ipcRenderer.invoke('comprasCafe:sendToBenefit', id, data)
    },
    bulk: {
        validate: (entity, rows) => ipcRenderer.invoke('bulk:validate', entity, rows),
        save: (entity, rows) => ipcRenderer.invoke('bulk:save', entity, rows)
    },
    // Beneficio
    beneficio: {
        getAll: () => ipcRenderer.invoke('beneficio:getAll'),
        create: (data) => ipcRenderer.invoke('beneficio:create', data),
        delete: (id) => ipcRenderer.invoke('beneficio:delete', id),
        rendimientoPorLote: () => ipcRenderer.invoke('beneficio:rendimientoPorLote')
    },
    // Inventario
    inventario: {
        getResumen: () => ipcRenderer.invoke('inventario:getResumen'),
        getMovimientos: () => ipcRenderer.invoke('inventario:getMovimientos'),
        getKardex: (filters) => ipcRenderer.invoke('inventario:getKardex', filters),
        getAgingAlerts: () => ipcRenderer.invoke('inventario:getAgingAlerts'),
        create: (data) => ipcRenderer.invoke('inventario:create', data),
        delete: (id) => ipcRenderer.invoke('inventario:delete', id)
    },
    ventasCafe: {
        getAll: (filters) => ipcRenderer.invoke('ventasCafe:getAll', filters),
        getSummary: () => ipcRenderer.invoke('ventasCafe:getSummary'),
        getAvailability: () => ipcRenderer.invoke('ventasCafe:getAvailability'),
        nextCode: () => ipcRenderer.invoke('ventasCafe:nextCode'),
        create: (data) => ipcRenderer.invoke('ventasCafe:create', data),
        cancel: (id) => ipcRenderer.invoke('ventasCafe:cancel', id)
    },
    // Gastos
    gastos: {
        getAll: (filtros) => ipcRenderer.invoke('gastos:getAll', filtros),
        create: (data) => ipcRenderer.invoke('gastos:create', data),
        delete: (id) => ipcRenderer.invoke('gastos:delete', id),
        resumen: (fi, ff) => ipcRenderer.invoke('gastos:resumen', fi, ff),
        total: (fi, ff) => ipcRenderer.invoke('gastos:total', fi, ff),
        getCategorias: () => ipcRenderer.invoke('gastos:getCategorias')
    },
    // Dashboard
    dashboard: {
        getStats: () => ipcRenderer.invoke('dashboard:getStats'),
        getRentabilidad: (año) => ipcRenderer.invoke('dashboard:getRentabilidad', año)
    },
    // Exportación
    exportar: {
        pdf: (opts) => ipcRenderer.invoke('exportar:pdf', opts),
        excel: (opts) => ipcRenderer.invoke('exportar:excel', opts)
    },
    // Sostenibilidad
    huella: {
        getAll: (lote_id) => ipcRenderer.invoke('huella:getAll', lote_id),
        create: (data) => ipcRenderer.invoke('huella:create', data),
        getTotal: () => ipcRenderer.invoke('huella:getTotal'),
        getTorta: () => ipcRenderer.invoke('huella:getTorta')
    },
    practicas: {
        getAll: () => ipcRenderer.invoke('practicas:getAll'),
        create: (data) => ipcRenderer.invoke('practicas:create', data),
        delete: (id) => ipcRenderer.invoke('practicas:delete', id)
    },
    certificaciones: {
        getAll: () => ipcRenderer.invoke('certificaciones:getAll'),
        create: (data) => ipcRenderer.invoke('certificaciones:create', data),
        delete: (id) => ipcRenderer.invoke('certificaciones:delete', id)
    },
    // Calidad
    calidad: {
        getAll: () => ipcRenderer.invoke('calidad:getAll'),
        create: (data) => ipcRenderer.invoke('calidad:create', data)
    },
    // Trazabilidad
    trazabilidad: {
        generarHash: (data) => ipcRenderer.invoke('trazabilidad:generarHash', data),
        getCadena: () => ipcRenderer.invoke('trazabilidad:getCadena'),
        verificar: () => ipcRenderer.invoke('trazabilidad:verificar'),
        getByLote: (lote_id) => ipcRenderer.invoke('trazabilidad:getByLote', lote_id),
        crearCodigo: (data) => ipcRenderer.invoke('trazabilidad:crearCodigo', data),
        getRutaCompleta: (lote_id) => ipcRenderer.invoke('trazabilidad:getRutaCompleta', lote_id),
        generarQR: (data) => ipcRenderer.invoke('trazabilidad:generarQR', data)
    },
    // Mercado
    mercado: {
        getPreciosRecientes: () => ipcRenderer.invoke('mercado:getPreciosRecientes'),
        getUltimoPrecio: (tipo_cafe) => ipcRenderer.invoke('mercado:getUltimoPrecio', tipo_cafe),
        getBenchmarks: (año) => ipcRenderer.invoke('mercado:getBenchmarks', año),
        insertarPrecio: (data) => ipcRenderer.invoke('mercado:insertarPrecio', data)
    },
    // Marketing
    marketing: {
        getClientes: () => ipcRenderer.invoke('marketing:getClientes'),
        crearCliente: (data) => ipcRenderer.invoke('marketing:crearCliente', data),
        actualizarCliente: (id, data) => ipcRenderer.invoke('marketing:actualizarCliente', id, data),
        getCampañas: () => ipcRenderer.invoke('marketing:getCampañas'),
        crearCampaña: (data) => ipcRenderer.invoke('marketing:crearCampaña', data),
        getPuntosLealtad: () => ipcRenderer.invoke('marketing:getPuntosLealtad'),
        agregarPuntos: (data) => ipcRenderer.invoke('marketing:agregarPuntos', data)
    },
    // Clima
    clima: {
        getRegistros: (dias) => ipcRenderer.invoke('clima:getRegistros', dias),
        crearRegistro: (data) => ipcRenderer.invoke('clima:crearRegistro', data),
        getLocation: () => ipcRenderer.invoke('clima:getLocation'),
        setLocation: (data) => ipcRenderer.invoke('clima:setLocation', data),
        searchLocations: (query) => ipcRenderer.invoke('clima:searchLocations', query),
        getCurrent: (options) => ipcRenderer.invoke('clima:getCurrent', options),
        getProviderStatus: () => ipcRenderer.invoke('clima:getProviderStatus'),
        getAlertas: () => ipcRenderer.invoke('clima:getAlertas'),
        crearAlerta: (data) => ipcRenderer.invoke('clima:crearAlerta', data),
        resolverAlerta: (id) => ipcRenderer.invoke('clima:resolverAlerta', id)
    },
    // Suscripción
    suscripcion: {
        getPerfiles: () => ipcRenderer.invoke('suscripcion:getPerfiles'),
        crearPerfil: (data) => ipcRenderer.invoke('suscripcion:crearPerfil', data),
        recomendar: (cliente_id) => ipcRenderer.invoke('suscripcion:recomendar', cliente_id),
        guardarFeedback: (data) => ipcRenderer.invoke('suscripcion:guardarFeedback', data),
        getRecomendaciones: (cliente_id) => ipcRenderer.invoke('suscripcion:getRecomendaciones', cliente_id)
    },
    // Educación
    educacion: {
        getArticulos: (categoria) => ipcRenderer.invoke('educacion:getArticulos', categoria),
        getArticulo: (id) => ipcRenderer.invoke('educacion:getArticulo', id),
        getTip: (modulo, accion) => ipcRenderer.invoke('educacion:getTip', modulo, accion),
        getProgress: () => ipcRenderer.invoke('educacion:getProgress'),
        saveProgress: (data) => ipcRenderer.invoke('educacion:saveProgress', data),
        saveQuiz: (data) => ipcRenderer.invoke('educacion:saveQuiz', data)
    },
    config: {
        getAll: () => ipcRenderer.invoke('config:getAll'),
        update: (values) => ipcRenderer.invoke('config:update', values),
        selectReportLogo: () => ipcRenderer.invoke('config:selectReportLogo'),
        clearReportLogo: () => ipcRenderer.invoke('config:clearReportLogo')
    },
    mcp: {
        getInfo: () => ipcRenderer.invoke('mcp:getInfo')
    },
    // Backup
    db: {
        backup: () => ipcRenderer.invoke('db:backup'),
        getStatus: () => ipcRenderer.invoke('db:getStatus'),
        switchMode: (options) => ipcRenderer.invoke('db:switchMode', options)
    },
    app: {
        getInfo: () => ipcRenderer.invoke('app:getInfo'),
        openDocs: (doc) => ipcRenderer.invoke('app:openDocs', doc)
    },
    // Eventos del menú
    on: (channel, callback) => {
        const validChannels = ['menu:nuevo', 'menu:guardar', 'navegar'];
        if (!validChannels.includes(channel) || typeof callback !== 'function') return () => {};
        const listener = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, listener);
        return () => ipcRenderer.removeListener(channel, listener);
    }
});
