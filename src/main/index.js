const { app, BrowserWindow, ipcMain, Menu, dialog, shell, net, session } = require('electron');
app.setName('Cafetal OS');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
import { AuthStore } from './auth-store.js';
import { startMcpServer } from './mcp-server.js';
import { validateEntity } from './domain-validation.js';
import { WeatherService, DEFAULT_TTL_MS } from './weather-service.js';

let mainWindow;
let db;
let authStore;
let weatherService;
let runtimeMode = process.argv.includes('--demo') ? 'demo' : 'production';
const authenticatedWindows = new Map();

const customUserDataArg = process.argv.find(arg => arg.startsWith('--user-data-path='));
if (customUserDataArg) {
    const customPath = customUserDataArg.slice('--user-data-path='.length);
    if (customPath) app.setPath('userData', path.resolve(customPath));
}

const PUBLIC_IPC_CHANNELS = new Set(['auth:login', 'auth:getCurrent', 'auth:logout', 'app:getInfo']);

function getSession(event) {
    return authenticatedWindows.get(event.sender.id) || null;
}

function requireSession(event) {
    const session = getSession(event);
    if (!session) throw new Error('AUTH_REQUIRED: Inicie sesión para continuar.');
    return session;
}

function secureHandle(channel, listener) {
    ipcMain.handle(channel, async (event, ...args) => {
        if (!PUBLIC_IPC_CHANNELS.has(channel)) requireSession(event);
        return listener(event, ...args);
    });
}


// ─── Helper SQL para sql.js ──────────────────────────────────────
// sql.js usa API diferente a better-sqlite3. Estas funciones ayudan.

const SQL = {
    // Ejecutar SELECT que devuelve un array de objetos
    query(sql, ...params) {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    },
    // SELECT que devuelve un solo objeto o null
    get(sql, ...params) {
        const rows = this.query(sql, ...params);
        return rows.length > 0 ? rows[0] : null;
    },
    // INSERT/UPDATE/DELETE
    run(sql, ...params) {
        db.run(sql, params);
        const row = this.get('SELECT last_insert_rowid() as id');
        return { lastInsertRowid: row ? row.id : null, changes: 1 };
    },
    // INSERT con objeto
    insert(table, data) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(',');
        const values = keys.map(k => data[k] === undefined ? null : data[k]);
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        return this.run(sql, ...values);
    },
    // UPDATE con objeto por ID
    update(table, data, id) {
        const keys = Object.keys(data);
        const sets = keys.map(k => `${k} = ?`).join(',');
        const values = [...keys.map(k => data[k] === undefined ? null : data[k]), id];
        return this.run(`UPDATE ${table} SET ${sets} WHERE id = ?`, ...values);
    },
    // INSERT parametrizado con objeto
    insertObj(table, data) {
        const keys = Object.keys(data);
        const vals = keys.map(k => data[k] === undefined || data[k] === null ? null : data[k]);
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${vals.map(() => '?').join(',')})`;
        db.run(sql, vals);
        const r = this.get("SELECT last_insert_rowid() as id");
        return { lastInsertRowid: r ? r.id : null };
    },
    // Ejecutar SQL múltiple (DDL)
    exec(sql) {
        db.exec(sql);
    }
};

// ─── Inicializar base de datos ─────────────────────────────────────
let dbPathActual;

function resourcePath(...segments) {
    return app.isPackaged
        ? path.join(process.resourcesPath, ...segments)
        : path.join(app.getAppPath(), ...segments);
}

function hasFlag(flag) {
    return process.argv.includes(flag);
}

function getRuntimeMode() {
    return runtimeMode;
}

function getDatabaseDestination(mode = getRuntimeMode()) {
    const filename = mode === 'demo' ? 'cafetal-os-demo-runtime.db' : 'cafetal-os.db';
    return path.join(app.getPath('userData'), filename);
}

function ensureDatabaseTemplate(destination, mode, reset = false) {
    const legacyName = mode === 'demo' ? 'cafetal-os-demo-runtime.db' : 'cafetal-os.db';
    const legacyPath = path.join(app.getPath('userData'), legacyName);
    if (!fs.existsSync(destination) && fs.existsSync(legacyPath)) {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(legacyPath, destination);
        console.info(`[Cafetal OS] Base anterior migrada desde ${legacyPath}`);
    }

    const templateName = mode === 'demo' ? 'cafetal-os-demo.db' : 'cafetal-os.db';
    const template = resourcePath('database', templateName);

    if (reset && fs.existsSync(destination)) fs.unlinkSync(destination);
    if (!fs.existsSync(destination) && fs.existsSync(template)) {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(template, destination);
    }
}

function tableColumns(table) {
    return new Set(SQL.query(`PRAGMA table_info(${table})`).map(column => column.name));
}

function addColumnIfMissing(table, column, definition) {
    const columns = tableColumns(table);
    if (!columns.has(column)) {
        SQL.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.info(`[Cafetal OS] Migración: ${table}.${column}`);
    }
}

function runDatabaseMigrations() {
    SQL.exec(`CREATE TABLE IF NOT EXISTS ventas_cafe (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        fecha DATE NOT NULL,
        cliente TEXT NOT NULL,
        identificacion_cliente TEXT,
        tipo_producto TEXT NOT NULL CHECK (tipo_producto IN ('cereza','pergamino_humedo','pergamino_seco','verde','tostado')),
        lote_id INTEGER,
        cantidad_kg REAL NOT NULL DEFAULT 0,
        cantidad_qq REAL NOT NULL DEFAULT 0,
        precio_por_kg REAL DEFAULT 0,
        precio_por_qq REAL DEFAULT 0,
        total_venta REAL NOT NULL DEFAULT 0,
        factura TEXT,
        destino TEXT,
        condicion_entrega TEXT,
        observaciones TEXT,
        inventario_id INTEGER,
        estado TEXT NOT NULL DEFAULT 'confirmada' CHECK (estado IN ('confirmada','anulada')),
        created_at DATETIME DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (lote_id) REFERENCES lotes(id),
        FOREIGN KEY (inventario_id) REFERENCES inventario(id)
    );
    CREATE INDEX IF NOT EXISTS idx_ventas_cafe_fecha ON ventas_cafe(fecha);
    CREATE INDEX IF NOT EXISTS idx_ventas_cafe_producto ON ventas_cafe(tipo_producto);`);
    addColumnIfMissing('lotes', 'es_sistema', 'INTEGER DEFAULT 0');
    addColumnIfMissing('recoleccion', 'planilla_id', 'INTEGER');
    addColumnIfMissing('recoleccion', 'unidad_corte', "TEXT DEFAULT 'lata'");
    addColumnIfMissing('recoleccion', 'cantidad_unidad', 'REAL');
    addColumnIfMissing('beneficio', 'compra_id', 'INTEGER');
    addColumnIfMissing('beneficio', 'origen_tipo', "TEXT DEFAULT 'propio'");
    addColumnIfMissing('inventario', 'compra_id', 'INTEGER');
    addColumnIfMissing('inventario', 'costo_origen', 'REAL DEFAULT 0');
    addColumnIfMissing('registros_clima', 'temp_actual', 'REAL');
    addColumnIfMissing('registros_clima', 'sensacion_termica', 'REAL');
    addColumnIfMissing('registros_clima', 'presion_superficie_hpa', 'REAL');
    addColumnIfMissing('registros_clima', 'codigo_clima', 'INTEGER');
    addColumnIfMissing('registros_clima', 'latitud', 'REAL');
    addColumnIfMissing('registros_clima', 'longitud', 'REAL');
    addColumnIfMissing('registros_clima', 'ubicacion_nombre', 'TEXT');
    addColumnIfMissing('registros_clima', 'zona_horaria', 'TEXT');
    addColumnIfMissing('registros_clima', 'consultado_en', 'TEXT');
    SQL.exec(`CREATE TABLE IF NOT EXISTS clima_api_cache (
        cache_key TEXT PRIMARY KEY,
        proveedor TEXT NOT NULL DEFAULT 'Open-Meteo',
        payload_json TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );`);
    const climateDefaults = {
        clima_proveedor: 'open-meteo',
        clima_geocodificador: 'open-meteo',
        clima_cache_ttl_minutos: '30',
        clima_latitud: '',
        clima_longitud: '',
        clima_ubicacion_nombre: '',
        clima_zona_horaria: 'auto'
    };
    for (const [key, value] of Object.entries(climateDefaults)) {
        if (!SQL.get('SELECT id FROM configuracion WHERE clave = ?', key)) SQL.run('INSERT INTO configuracion (clave, valor) VALUES (?, ?)', key, value);
    }
    try { SQL.run('CREATE INDEX IF NOT EXISTS idx_recoleccion_planilla ON recoleccion(planilla_id)'); } catch (error) { console.warn(error.message); }
    try { SQL.run('CREATE INDEX IF NOT EXISTS idx_inventario_compra ON inventario(compra_id)'); } catch (error) { console.warn(error.message); }
    try { SQL.run('CREATE INDEX IF NOT EXISTS idx_registros_clima_fecha_fuente ON registros_clima(fecha, fuente)'); } catch (error) { console.warn(error.message); }
}

async function initDatabase({ mode = getRuntimeMode(), reset = false } = {}) {
    const initSqlJs = require('sql.js');
    const SQLJS = await initSqlJs();
    const dbPath = getDatabaseDestination(mode);
    ensureDatabaseTemplate(dbPath, mode, reset);
    dbPathActual = dbPath;
    runtimeMode = mode;

    if (fs.existsSync(dbPath)) {
        db = new SQLJS.Database(fs.readFileSync(dbPath));
    } else {
        db = new SQLJS.Database();
    }

    const schemaPath = resourcePath('database', 'schema.sql');
    db.exec(fs.readFileSync(schemaPath, 'utf-8'));
    runDatabaseMigrations();

    const count = SQL.get('SELECT COUNT(*) as c FROM variedades');
    if (!count || count.c === 0) {
        const seedsPath = resourcePath('database', 'seeds.sql');
        const seeds = fs.readFileSync(seedsPath, 'utf-8');
        seeds.split(';').filter(statement => statement.trim()).forEach(statement => {
            try { db.run(statement.trim() + ';'); } catch (error) { console.warn('Seed omitido:', error.message); }
        });
    }

    guardarDB();
    return db;
}

async function switchDatabaseMode(mode, reset = false) {
    if (!['production', 'demo'].includes(mode)) throw new Error('Modo de base de datos inválido.');
    guardarDB();
    if (db) {
        db.close();
        db = null;
    }
    await initDatabase({ mode, reset });
    initializeWeatherService();
    return { version: app.getVersion(), mode: getRuntimeMode(), databasePath: dbPathActual };
}

function guardarDB() {
    try {
        if (!dbPathActual || !db) return;
        fs.mkdirSync(path.dirname(dbPathActual), { recursive: true });
        fs.writeFileSync(dbPathActual, Buffer.from(db.export()));
    } catch (error) {
        console.error('Error guardando BD:', error);
    }
}

function parseFarmCoordinates(value) {
    const text = String(value || '').trim().replace(',', ' ');
    if (!text) return null;
    const matches = [...text.matchAll(/(-?\d+(?:\.\d+)?)\s*°?\s*([NSEO])?/gi)];
    if (matches.length < 2) return null;
    const signed = (match, axis) => {
        let number = Number(match[1]);
        const direction = String(match[2] || '').toUpperCase();
        if ((axis === 'latitude' && direction === 'S') || (axis === 'longitude' && ['O','W'].includes(direction))) number = -Math.abs(number);
        return number;
    };
    const latitude = signed(matches[0], 'latitude');
    const longitude = signed(matches[1], 'longitude');
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude };
}

function getClimateLocationConfig() {
    const config = getConfigurationMap();
    const farm = SQL.get('SELECT nombre, ubicacion, coordenadas FROM finca WHERE activo = 1 LIMIT 1') || {};
    const configuredLatitude = Number(config.clima_latitud);
    const configuredLongitude = Number(config.clima_longitud);
    const configured = Number.isFinite(configuredLatitude) && Number.isFinite(configuredLongitude)
        && String(config.clima_latitud || '').trim() !== '' && String(config.clima_longitud || '').trim() !== '';
    const parsed = parseFarmCoordinates(farm.coordenadas);
    const coordinates = configured ? { latitude: configuredLatitude, longitude: configuredLongitude } : parsed;
    return {
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        locationName: config.clima_ubicacion_nombre || farm.ubicacion || farm.nombre || '',
        timezone: config.clima_zona_horaria || 'auto',
        provider: config.clima_proveedor || 'open-meteo',
        geocoder: config.clima_geocodificador || 'open-meteo',
        ttlMinutes: Number(config.clima_cache_ttl_minutos || 30),
        source: configured ? 'configuracion' : parsed ? 'finca' : 'sin_configurar'
    };
}

async function fetchJsonWithElectron(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await net.fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': `Cafetal-OS/${app.getVersion()} (${process.platform})`
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        return await response.json();
    } catch (error) {
        if (error?.name === 'AbortError') throw new Error('La consulta climática superó el tiempo máximo de espera.');
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function readWeatherCache(cacheKey) {
    const row = SQL.get('SELECT payload_json, fetched_at FROM clima_api_cache WHERE cache_key = ?', cacheKey);
    if (!row) return null;
    try { return { payload: JSON.parse(row.payload_json), fetchedAt: row.fetched_at }; }
    catch (error) {
        console.warn('[Cafetal OS] Caché climático inválido:', error.message);
        return null;
    }
}

function writeWeatherCache(cacheKey, payload) {
    const json = JSON.stringify(payload);
    const existing = SQL.get('SELECT cache_key FROM clima_api_cache WHERE cache_key = ?', cacheKey);
    if (existing) SQL.run("UPDATE clima_api_cache SET payload_json = ?, fetched_at = ?, updated_at = datetime('now','localtime') WHERE cache_key = ?", json, payload.fetchedAt, cacheKey);
    else SQL.run('INSERT INTO clima_api_cache (cache_key, proveedor, payload_json, fetched_at) VALUES (?, ?, ?, ?)', cacheKey, payload.provider || 'Open-Meteo', json, payload.fetchedAt);
    guardarDB();
}

function initializeWeatherService() {
    const config = getClimateLocationConfig();
    const ttlMinutes = Number.isFinite(config.ttlMinutes) ? Math.min(120, Math.max(5, config.ttlMinutes)) : 30;
    weatherService = new WeatherService({
        fetchJson: fetchJsonWithElectron,
        readCache: async key => readWeatherCache(key),
        writeCache: async (key, payload) => writeWeatherCache(key, payload),
        ttlMs: ttlMinutes * 60 * 1000 || DEFAULT_TTL_MS
    });
}

function persistWeatherSnapshot(weather) {
    const current = weather?.current || {};
    const today = weather?.daily?.[0] || {};
    const record = {
        fecha: String(today.date || current.time || new Date().toISOString()).slice(0, 10),
        precipitacion_mm: Number(today.precipitationSum ?? current.precipitation ?? 0),
        temp_max: Number.isFinite(Number(today.temperatureMax)) ? Number(today.temperatureMax) : Number(current.temperature),
        temp_min: Number.isFinite(Number(today.temperatureMin)) ? Number(today.temperatureMin) : Number(current.temperature),
        humedad_relativa: Number(current.relativeHumidity),
        velocidad_viento: Number(current.windSpeed || 0),
        fuente: 'open-meteo',
        notas: `${current.weatherLabel || 'Condición meteorológica'}${weather.cache?.stale ? ' · dato recuperado de caché' : ''}`,
        temp_actual: Number(current.temperature),
        sensacion_termica: Number(current.apparentTemperature),
        presion_superficie_hpa: Number(current.surfacePressure),
        codigo_clima: Number(current.weatherCode),
        latitud: Number(weather.latitude),
        longitud: Number(weather.longitude),
        ubicacion_nombre: weather.locationName || '',
        zona_horaria: weather.timezone || '',
        consultado_en: weather.fetchedAt || new Date().toISOString()
    };
    const existing = SQL.get("SELECT id FROM registros_clima WHERE fecha = ? AND fuente = 'open-meteo' ORDER BY id DESC LIMIT 1", record.fecha);
    if (existing) SQL.update('registros_clima', record, existing.id);
    else SQL.insertObj('registros_clima', record);
    guardarDB();
    return record;
}

function isTrustedRendererRequest(webContents, requestingUrl = '') {
    if (!mainWindow || webContents.id !== mainWindow.webContents.id) return false;
    const devUrl = process.env.ELECTRON_RENDERER_URL;
    if (devUrl && String(requestingUrl || '').startsWith(devUrl)) return true;
    return String(requestingUrl || '').startsWith('file://') || !requestingUrl;
}

function configureRendererPermissions() {
    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) =>
        permission === 'geolocation' && isTrustedRendererRequest(webContents, requestingOrigin));
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
        const allowed = permission === 'geolocation' && isTrustedRendererRequest(webContents, details?.requestingUrl || '');
        callback(allowed);
    });
}

// ─── Ventana principal ─────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 360,
        minHeight: 600,
        show: false,
        backgroundColor: '#f5f1e8',
        title: 'Cafetal OS',
        icon: resourcePath('build', 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            backgroundThrottling: false,
            devTools: true
        }
    });

    mainWindow.once('ready-to-show', () => mainWindow.show());
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https:\/\//i.test(url)) shell.openExternal(url);
        return { action: 'deny' };
    });
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const allowedDevUrl = process.env.ELECTRON_RENDERER_URL;
        if (allowedDevUrl && url.startsWith(allowedDevUrl)) return;
        if (url.startsWith('file://')) return;
        event.preventDefault();
    });

    const loadPromise = process.env.ELECTRON_RENDERER_URL
        ? mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
        : mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    loadPromise.catch(error => {
        console.error('[Cafetal OS] No se pudo cargar el renderer:', error);
    });
    mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
        console.error(`[Cafetal OS] did-fail-load ${code}: ${description} (${url})`);
    });
    mainWindow.webContents.on('context-menu', (_event, params) => {
        Menu.buildFromTemplate([
            { label: 'Inspeccionar elemento', click: () => mainWindow?.webContents.inspectElement(params.x, params.y) },
            { type: 'separator' },
            { role: 'copy', label: 'Copiar', enabled: params.editFlags?.canCopy || Boolean(params.selectionText) },
            { role: 'paste', label: 'Pegar', enabled: params.editFlags?.canPaste || false }
        ]).popup({ window: mainWindow });
    });

    const menuTemplate = [
        {
            label: 'Archivo',
            submenu: [
                { label: 'Nuevo registro', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu:nuevo') },
                { label: 'Guardar', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu:guardar') },
                { type: 'separator' },
                { label: 'Ir a reportes', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.send('navegar', 'reportes') },
                { label: 'Crear respaldo', click: () => hacerBackup() },
                { label: 'Configuración', accelerator: 'CmdOrCtrl+,', click: () => mainWindow.webContents.send('navegar', 'configuracion') },
                { type: 'separator' },
                { role: 'quit', label: 'Salir' }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload', label: 'Recargar interfaz', accelerator: 'CmdOrCtrl+R' },
                { role: 'forceReload', label: 'Forzar recarga', accelerator: 'CmdOrCtrl+Shift+R' },
                { type: 'separator' },
                { label: 'Herramientas de desarrollo', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
                { label: 'Herramientas de desarrollo (alternativa)', accelerator: 'CmdOrCtrl+Shift+I', visible: false, click: () => mainWindow?.webContents.toggleDevTools() },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Tamaño real' },
                { role: 'zoomIn', label: 'Acercar' },
                { role: 'zoomOut', label: 'Alejar' },
                { role: 'togglefullscreen', label: 'Pantalla completa' }
            ]
        },
        {
            label: 'Módulos',
            submenu: [
                ['Inicio', 'inicio'], ['Mi finca', 'finca'], ['Lotes', 'lotes'], ['Cosecha', 'cosecha'],
                ['Beneficio', 'beneficio'], ['Inventario', 'inventario'], ['Gastos', 'gastos'], ['Compras de café', 'compras'], ['Ventas de café', 'ventas'],
                ['Reportes', 'reportes'], ['Sostenibilidad', 'sostenibilidad'], ['Calidad', 'calidad'], ['Trazabilidad', 'trazabilidad']
            ].map(([label, route]) => ({ label, click: () => mainWindow.webContents.send('navegar', route) }))
        },
        {
            label: 'Ayuda',
            submenu: [
                { label: 'Manual de usuario', click: () => shell.openPath(resourcePath('docs', 'MANUAL_USUARIO.md')) },
                { label: 'Guía para contribuir', click: () => shell.openPath(resourcePath('CONTRIBUTING.md')) },
                { type: 'separator' },
                {
                    label: 'Acerca de Cafetal OS',
                    click: () => dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Cafetal OS',
                        message: `Cafetal OS v${app.getVersion()}`,
                        detail: `Sistema comunitario abierto para la gestión cafetalera.
Modo actual: ${getRuntimeMode()}.`
                    })
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    const webContentsId = mainWindow.webContents.id;
    mainWindow.webContents.on('destroyed', () => authenticatedWindows.delete(webContentsId));
    mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Backup ──────────────────────────────────────────────────────
function hacerBackup() {
    guardarDB();
    const docsPath = path.join(app.getPath('documents'), 'CafetalOS', 'Respaldos');
    if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(docsPath, `cafetal-os_${getRuntimeMode()}_${stamp}.db`);
    try {
        fs.copyFileSync(dbPathActual, backupFile);
        dialog.showMessageBox(mainWindow, { type: 'info', title: 'Respaldo completado', message: `Respaldo guardado en:
${backupFile}` });
        return backupFile;
    } catch (error) {
        dialog.showErrorBox('Error', `No se pudo crear el respaldo:
${error.message}`);
        return null;
    }
}

// ─── Reglas de negocio transversales ────────────────────────────────
function activeFinca() {
    return SQL.get('SELECT id, nombre, area_cafe_mz FROM finca WHERE activo = 1 ORDER BY id LIMIT 1');
}

function requireActiveFinca() {
    const finca = activeFinca();
    if (!finca) throw new Error('Configure primero los datos de Mi finca antes de registrar lotes.');
    return finca;
}

function assertActiveLote(loteId) {
    if (!loteId) return null;
    const lote = SQL.get('SELECT id, codigo, area_mz, finca_id, es_sistema FROM lotes WHERE id = ? AND activo = 1', loteId);
    if (!lote) throw new Error('El lote seleccionado no existe o está inactivo. Actualice la lista e inténtelo nuevamente.');
    return lote;
}

function assertLoteCodeAvailable(codigo, excludeId = null) {
    const finca = requireActiveFinca();
    const duplicate = excludeId
        ? SQL.get('SELECT id FROM lotes WHERE finca_id = ? AND UPPER(codigo) = UPPER(?) AND id <> ? AND activo = 1', finca.id, codigo, excludeId)
        : SQL.get('SELECT id FROM lotes WHERE finca_id = ? AND UPPER(codigo) = UPPER(?) AND activo = 1', finca.id, codigo);
    if (duplicate) throw new Error(`Ya existe un lote activo con el código ${codigo}. Use un código único.`);
}

function assertLoteAreaCapacity(areaMz, excludeId = null) {
    const finca = SQL.get('SELECT area_cafe_mz FROM finca WHERE activo = 1 LIMIT 1');
    const capacity = Number(finca?.area_cafe_mz || 0);
    if (capacity <= 0) return;
    const used = excludeId
        ? Number((SQL.get('SELECT COALESCE(SUM(area_mz),0) AS total FROM lotes WHERE activo = 1 AND COALESCE(es_sistema,0) = 0 AND id <> ?', excludeId) || {}).total || 0)
        : Number((SQL.get('SELECT COALESCE(SUM(area_mz),0) AS total FROM lotes WHERE activo = 1 AND COALESCE(es_sistema,0) = 0') || {}).total || 0);
    if (used + Number(areaMz) > capacity + 0.001) {
        throw new Error(`El área acumulada de los lotes (${(used + Number(areaMz)).toFixed(2)} mz) superaría el área de café configurada (${capacity.toFixed(2)} mz). Revise la finca o el área del lote.`);
    }
}

function currentInventoryStock(tipoProducto, loteId = null) {
    const where = loteId ? ' AND lote_id = ?' : '';
    const params = loteId ? [tipoProducto, loteId] : [tipoProducto];
    const row = SQL.get(`SELECT COALESCE(SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad_qq ELSE -cantidad_qq END),0) AS saldo FROM inventario WHERE tipo_producto = ?${where}`, ...params);
    return Number(row?.saldo || 0);
}

// ─── IPC Handlers ──────────────────────────────────────────────────

// Finca
secureHandle('finca:get', () => SQL.get('SELECT * FROM finca WHERE activo = 1 LIMIT 1'));

secureHandle('finca:update', (event, data) => {
    data = validateEntity('finca', data);
    const lotArea = Number((SQL.get('SELECT COALESCE(SUM(area_mz),0) AS total FROM lotes WHERE activo = 1 AND COALESCE(es_sistema,0) = 0') || {}).total || 0);
    if (data.area_cafe_mz != null && data.area_cafe_mz + 0.001 < lotArea) throw new Error(`El área de café no puede ser menor que el área acumulada de lotes activos (${lotArea.toFixed(2)} mz).`);
    const existing = SQL.get('SELECT id FROM finca WHERE activo = 1 LIMIT 1');
    if (existing) {
        SQL.update('finca', data, existing.id);
    } else {
        SQL.insertObj('finca', data);
    }
    guardarDB();
    return { changes: 1 };
});

// Variedades
secureHandle('variedades:getAll', () => SQL.query('SELECT * FROM variedades ORDER BY nombre'));

// Lotes
secureHandle('lotes:getAll', () => SQL.query(`SELECT l.*, v.nombre as variedad_nombre,
    (SELECT COALESCE(SUM(latas_recolectadas),0) FROM recoleccion WHERE lote_id = l.id) as total_latas,
    (SELECT COALESCE(SUM(kilos_estimados),0) FROM recoleccion WHERE lote_id = l.id) as total_kilos
    FROM lotes l LEFT JOIN variedades v ON l.variedad_id = v.id
    WHERE l.activo = 1 AND COALESCE(l.es_sistema,0) = 0 ORDER BY l.codigo`));

secureHandle('lotes:getById', (event, id) => SQL.get(`SELECT l.*, v.nombre as variedad_nombre 
    FROM lotes l LEFT JOIN variedades v ON l.variedad_id = v.id WHERE l.id = ?`, id));

secureHandle('lotes:create', (event, data) => {
    data = validateEntity('lote', data);
    const finca = requireActiveFinca();
    data.finca_id = finca.id;
    assertLoteCodeAvailable(data.codigo);
    assertLoteAreaCapacity(data.area_mz);
    const result = SQL.insertObj('lotes', data);
    guardarDB();
    return result;
});

secureHandle('lotes:update', (event, id, data) => {
    data = validateEntity('lote', data);
    assertLoteCodeAvailable(data.codigo, id);
    assertLoteAreaCapacity(data.area_mz, id);
    SQL.update('lotes', data, id);
    guardarDB();
    return { changes: 1 };
});

secureHandle('lotes:delete', (event, id) => {
    SQL.run('UPDATE lotes SET activo = 0 WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
});

secureHandle('lotes:getResumen', () => SQL.get(`SELECT 
    COUNT(*) as total_lotes,
    COALESCE(SUM(area_mz), 0) as total_area,
    COALESCE((SELECT COUNT(*) FROM lotes WHERE estado = 'produccion' AND activo = 1), 0) as en_produccion
    FROM lotes WHERE activo = 1 AND COALESCE(es_sistema,0) = 0`));

// Recolectores
secureHandle('recolectores:getAll', () => SQL.query('SELECT * FROM recolectores WHERE activo = 1 ORDER BY nombre_completo'));

secureHandle('recolectores:create', (event, data) => {
    data = validateEntity('recolector', data);
    const result = SQL.insertObj('recolectores', data);
    guardarDB();
    return result;
});

// Cosecha
secureHandle('cosecha:getLatestDate', () => (SQL.get('SELECT MAX(fecha) AS fecha FROM recoleccion') || {}).fecha || null);

secureHandle('cosecha:getByDate', (event, fecha) => 
    SQL.query(`SELECT c.*, l.codigo as lote_codigo, r.nombre_completo as recolector_nombre
        FROM recoleccion c JOIN lotes l ON c.lote_id = l.id
        LEFT JOIN recolectores r ON c.recolector_id = r.id
        WHERE c.fecha = ? ORDER BY c.hora_inicio`, fecha));

secureHandle('cosecha:getByLote', (event, lote_id) => 
    SQL.query(`SELECT c.*, l.codigo as lote_codigo, r.nombre_completo as recolector_nombre
        FROM recoleccion c JOIN lotes l ON c.lote_id = l.id
        LEFT JOIN recolectores r ON c.recolector_id = r.id
        WHERE c.lote_id = ? ORDER BY c.fecha DESC`, lote_id));

secureHandle('cosecha:create', (event, data) => {
    data = validateEntity('cosecha', data);
    assertActiveLote(data.lote_id);
    if (data.recolector_id && !SQL.get('SELECT id FROM recolectores WHERE id = ? AND activo = 1', data.recolector_id)) throw new Error('El recolector seleccionado no existe o está inactivo.');
    const result = SQL.insertObj('recoleccion', data);
    guardarDB();
    return result;
});

secureHandle('cosecha:delete', (event, id) => {
    SQL.run('DELETE FROM recoleccion WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
});

secureHandle('cosecha:getResumen', (event, fechaIni, fechaFin) => 
    SQL.get(`SELECT COALESCE(SUM(latas_recolectadas), 0) as total_latas,
        COALESCE(SUM(kilos_estimados), 0) as total_kilos,
        COALESCE(SUM(total_pagado), 0) as total_pagado,
        COUNT(*) as total_cortes
        FROM recoleccion WHERE fecha >= ? AND fecha <= ?`, fechaIni, fechaFin));

secureHandle('cosecha:getLastDays', (event, days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const fecha = d.toISOString().split('T')[0];
    return SQL.query(`SELECT fecha, SUM(latas_recolectadas) as latas, SUM(kilos_estimados) as kilos
        FROM recoleccion WHERE fecha >= ? GROUP BY fecha ORDER BY fecha`, fecha);
});

// Beneficio
secureHandle('beneficio:getAll', () => 
    SQL.query(`SELECT b.*, l.codigo as lote_codigo
        FROM beneficio b JOIN lotes l ON b.lote_id = l.id ORDER BY b.fecha_inicio DESC`));

secureHandle('beneficio:create', (event, data) => {
    data = validateEntity('beneficio', data);
    assertActiveLote(data.lote_id);
    const result = SQL.insertObj('beneficio', data);
    const beneficioId = result.lastInsertRowid;

    // ★ FLUJO 1: Auto-entrada a Inventario desde Beneficio
    // Si se obtuvo pergamino, se registra automáticamente como entrada en inventario
    if (data.kilos_pergamino_seco && parseFloat(data.kilos_pergamino_seco) > 0) {
        const qq = parseFloat(data.kilos_pergamino_seco) / 46;
        SQL.insertObj('inventario', {
            tipo_producto: 'pergamino_seco',
            lote_id: data.lote_id,
            beneficio_id: beneficioId,
            tipo_movimiento: 'entrada',
            cantidad_qq: Math.round(qq * 100) / 100,
            cantidad_kg: data.kilos_pergamino_seco,
            fecha_movimiento: data.fecha_fin || data.fecha_inicio,
            ubicacion: 'Beneficio',
            observaciones: `Auto-generado desde beneficio #${beneficioId}`
        });
    }

    guardarDB();
    return result;
});

secureHandle('beneficio:delete', (event, id) => {
    SQL.run('DELETE FROM beneficio WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
});

secureHandle('beneficio:rendimientoPorLote', () => 
    SQL.query(`SELECT l.codigo, AVG(b.rendimiento_porcentaje) as rend_promedio,
        COUNT(*) as procesos, SUM(b.kilos_pergamino_seco) as total_pergamino
        FROM beneficio b JOIN lotes l ON b.lote_id = l.id
        GROUP BY l.id ORDER BY rend_promedio DESC`));

// Inventario
// ★ Corregido: cálculo correcto de existencias
// entrada → suma, salida/venta → resta
secureHandle('inventario:getResumen', () => 
    SQL.query(`SELECT tipo_producto, 
        ROUND(SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad_qq 
                       WHEN tipo_movimiento IN ('salida','venta') THEN -cantidad_qq 
                       ELSE 0 END), 2) as existencias_qq
        FROM inventario GROUP BY tipo_producto ORDER BY tipo_producto`));

secureHandle('inventario:getMovimientos', () => 
    SQL.query(`SELECT i.*, l.codigo as lote_codigo
        FROM inventario i LEFT JOIN lotes l ON i.lote_id = l.id
        ORDER BY i.fecha_movimiento DESC LIMIT 100`));

secureHandle('inventario:create', (event, data) => {
    data = validateEntity('inventario', data);
    if (data.lote_id) assertActiveLote(data.lote_id);
    if (data.tipo_movimiento !== 'entrada') {
        const available = currentInventoryStock(data.tipo_producto, data.lote_id || null);
        if (data.cantidad_qq > available + 0.001) throw new Error(`Existencias insuficientes: disponibles ${available.toFixed(2)} qq y solicitados ${data.cantidad_qq.toFixed(2)} qq.`);
    }
    data.cantidad_kg = data.cantidad_qq * 46;
    if ((data.tipo_movimiento === 'venta') && data.precio_venta_qq) {
        data.total_venta = data.cantidad_qq * data.precio_venta_qq;
    }
    const result = SQL.insertObj('inventario', data);
    guardarDB();
    return result;
});

secureHandle('inventario:delete', (event, id) => {
    const movement = SQL.get('SELECT * FROM inventario WHERE id = ?', id);
    if (!movement) throw new Error('El movimiento de inventario no existe.');
    if (movement.tipo_movimiento === 'venta' || movement.compra_id || movement.beneficio_id) {
        throw new Error('Este movimiento proviene de una venta, compra o beneficio y debe administrarse desde su módulo de origen.');
    }
    SQL.run('DELETE FROM inventario WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
});

const inventoryAgeThresholds = {
    cereza: { warning: 1, critical: 2, label: 'Cereza' },
    pergamino_humedo: { warning: 2, critical: 4, label: 'Pergamino húmedo' },
    pergamino_seco: { warning: 180, critical: 365, label: 'Pergamino seco' },
    verde: { warning: 180, critical: 365, label: 'Café verde / oro' },
    tostado: { warning: 21, critical: 45, label: 'Café tostado' }
};

function differenceInDays(dateText) {
    const date = new Date(`${dateText}T12:00:00`);
    if (Number.isNaN(date.getTime())) return 0;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function inventoryAgingLots() {
    const movements = SQL.query(`SELECT i.*, l.codigo AS lote_codigo,
        COALESCE(c.humedad_porcentaje, b.humedad_final_porcentaje) AS humedad_referencia
        FROM inventario i
        LEFT JOIN lotes l ON i.lote_id = l.id
        LEFT JOIN compras_cafe c ON i.compra_id = c.id
        LEFT JOIN beneficio b ON i.beneficio_id = b.id
        ORDER BY i.fecha_movimiento ASC, i.id ASC`);
    const groups = new Map();
    for (const movement of movements) {
        const key = `${movement.tipo_producto}|${movement.lote_id || 0}`;
        if (!groups.has(key)) groups.set(key, []);
        const queue = groups.get(key);
        const quantity = Number(movement.cantidad_qq || 0);
        if (movement.tipo_movimiento === 'entrada') {
            queue.push({
                movement_id: movement.id,
                tipo_producto: movement.tipo_producto,
                lote_id: movement.lote_id || null,
                lote_codigo: movement.lote_codigo || 'Stock general / acopio',
                fecha_entrada: movement.fecha_movimiento,
                ubicacion: movement.ubicacion || 'Sin ubicación',
                humedad_referencia: movement.humedad_referencia,
                cantidad_original_qq: quantity,
                restante_qq: quantity,
                compra_id: movement.compra_id || null,
                beneficio_id: movement.beneficio_id || null
            });
            continue;
        }
        let pending = quantity;
        for (const entry of queue) {
            if (pending <= 0) break;
            const consumed = Math.min(entry.restante_qq, pending);
            entry.restante_qq -= consumed;
            pending -= consumed;
        }
    }
    return [...groups.values()].flat().filter(entry => entry.restante_qq > 0.0001).map(entry => {
        const ageDays = differenceInDays(entry.fecha_entrada);
        const threshold = inventoryAgeThresholds[entry.tipo_producto] || { warning: 180, critical: 365, label: entry.tipo_producto };
        const humidity = entry.humedad_referencia == null ? null : Number(entry.humedad_referencia);
        let status = ageDays >= threshold.critical ? 'critico' : ageDays >= threshold.warning ? 'advertencia' : 'estable';
        const reasons = [];
        if (status === 'critico') reasons.push(`Antigüedad superior a ${threshold.critical} días`);
        else if (status === 'advertencia') reasons.push(`Revisar rotación a partir de ${threshold.warning} días`);
        if (['pergamino_seco','verde'].includes(entry.tipo_producto) && humidity != null && humidity > 12.5) {
            status = 'critico'; reasons.push(`Humedad ${humidity.toFixed(1)}% superior a 12.5%`);
        } else if (['pergamino_seco','verde'].includes(entry.tipo_producto) && humidity != null && humidity > 11.5) {
            if (status === 'estable') status = 'advertencia';
            reasons.push(`Humedad ${humidity.toFixed(1)}% requiere vigilancia`);
        }
        return {
            ...entry,
            producto_label: threshold.label,
            antiguedad_dias: ageDays,
            umbral_advertencia_dias: threshold.warning,
            umbral_critico_dias: threshold.critical,
            estado: status,
            razones: reasons,
            restante_kg: entry.restante_qq * 46
        };
    }).sort((a, b) => b.antiguedad_dias - a.antiguedad_dias);
}

secureHandle('inventario:getKardex', (event, filters = {}) => {
    const conditions = ['1=1'];
    const params = [];
    if (filters.tipo_producto) { conditions.push('i.tipo_producto = ?'); params.push(filters.tipo_producto); }
    if (filters.lote_id === 'general') conditions.push('i.lote_id IS NULL');
    else if (filters.lote_id) { conditions.push('i.lote_id = ?'); params.push(Number(filters.lote_id)); }
    if (filters.fecha_ini) { conditions.push('i.fecha_movimiento >= ?'); params.push(filters.fecha_ini); }
    if (filters.fecha_fin) { conditions.push('i.fecha_movimiento <= ?'); params.push(filters.fecha_fin); }
    const rows = SQL.query(`SELECT i.*, l.codigo AS lote_codigo, v.codigo AS venta_codigo
        FROM inventario i
        LEFT JOIN lotes l ON i.lote_id = l.id
        LEFT JOIN ventas_cafe v ON v.inventario_id = i.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY i.fecha_movimiento ASC, i.id ASC`, ...params);
    const balances = new Map();
    const calculated = rows.map(row => {
        const key = `${row.tipo_producto}|${row.lote_id || 0}`;
        const previous = Number(balances.get(key) || 0);
        const signed = row.tipo_movimiento === 'entrada' ? Number(row.cantidad_qq || 0) : -Number(row.cantidad_qq || 0);
        const balance = previous + signed;
        balances.set(key, balance);
        return { ...row, cantidad_firmada_qq: signed, saldo_qq: balance };
    });
    return calculated.reverse();
});

secureHandle('inventario:getAgingAlerts', () => {
    const lots = inventoryAgingLots();
    return {
        lots,
        summary: {
            total_lotes_stock: lots.length,
            criticos: lots.filter(item => item.estado === 'critico').length,
            advertencias: lots.filter(item => item.estado === 'advertencia').length,
            estables: lots.filter(item => item.estado === 'estable').length,
            stock_qq: lots.reduce((sum, item) => sum + Number(item.restante_qq || 0), 0)
        },
        note: 'Los umbrales son alertas operativas configuradas para revisión. La vida útil real depende de humedad, empaque, ventilación, temperatura, calidad y condiciones de bodega.'
    };
});

function saleCode() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const row = SQL.get("SELECT COUNT(*) AS total FROM ventas_cafe WHERE fecha = date('now','localtime')");
    return `VTA-${date}-${String(Number(row?.total || 0) + 1).padStart(3, '0')}`;
}

secureHandle('ventasCafe:getAll', (event, filters = {}) => {
    const conditions = ['1=1']; const params = [];
    if (filters.tipo_producto) { conditions.push('v.tipo_producto = ?'); params.push(filters.tipo_producto); }
    if (filters.estado) { conditions.push('v.estado = ?'); params.push(filters.estado); }
    return SQL.query(`SELECT v.*, l.codigo AS lote_codigo
        FROM ventas_cafe v LEFT JOIN lotes l ON v.lote_id = l.id
        WHERE ${conditions.join(' AND ')} ORDER BY v.fecha DESC, v.id DESC LIMIT 500`, ...params);
});

secureHandle('ventasCafe:getSummary', () => SQL.get(`SELECT COUNT(*) AS total_ventas,
    COALESCE(SUM(CASE WHEN estado='confirmada' THEN cantidad_kg ELSE 0 END),0) AS kilos,
    COALESCE(SUM(CASE WHEN estado='confirmada' THEN cantidad_qq ELSE 0 END),0) AS quintales,
    COALESCE(SUM(CASE WHEN estado='confirmada' THEN total_venta ELSE 0 END),0) AS ingresos,
    COALESCE(SUM(CASE WHEN estado='anulada' THEN 1 ELSE 0 END),0) AS anuladas
    FROM ventas_cafe`));

secureHandle('ventasCafe:getAvailability', () => SQL.query(`SELECT i.tipo_producto, i.lote_id,
    COALESCE(l.codigo,'Stock general / acopio') AS lote_codigo,
    ROUND(SUM(CASE WHEN i.tipo_movimiento='entrada' THEN i.cantidad_qq ELSE -i.cantidad_qq END),4) AS disponible_qq
    FROM inventario i LEFT JOIN lotes l ON i.lote_id=l.id
    GROUP BY i.tipo_producto, i.lote_id
    HAVING disponible_qq > 0.0001
    ORDER BY i.tipo_producto, lote_codigo`));

secureHandle('ventasCafe:nextCode', () => saleCode());

secureHandle('ventasCafe:create', (event, raw = {}) => {
    const data = {
        codigo: String(raw.codigo || '').trim(),
        fecha: String(raw.fecha || '').trim(),
        cliente: String(raw.cliente || '').trim(),
        identificacion_cliente: String(raw.identificacion_cliente || '').trim() || null,
        tipo_producto: String(raw.tipo_producto || '').trim(),
        lote_id: raw.lote_id ? Number(raw.lote_id) : null,
        cantidad_kg: Number(raw.cantidad_kg || 0),
        cantidad_qq: Number(raw.cantidad_qq || 0),
        precio_por_kg: Number(raw.precio_por_kg || 0),
        precio_por_qq: Number(raw.precio_por_qq || 0),
        factura: String(raw.factura || '').trim() || null,
        destino: String(raw.destino || '').trim() || null,
        condicion_entrega: String(raw.condicion_entrega || '').trim() || null,
        observaciones: String(raw.observaciones || '').trim() || null
    };
    if (!data.codigo) data.codigo = saleCode();
    if (!/^VTA-[A-Z0-9-]+$/i.test(data.codigo)) throw new Error('Use un código de venta válido, por ejemplo VTA-20260721-001.');
    if (!data.fecha) throw new Error('La fecha de venta es obligatoria.');
    if (!data.cliente || data.cliente.length < 3) throw new Error('Registre el nombre del cliente o comprador.');
    if (!Object.hasOwn(inventoryAgeThresholds, data.tipo_producto)) throw new Error('Seleccione un estado válido del café.');
    if (data.lote_id) assertActiveLote(data.lote_id);
    if (!(data.cantidad_qq > 0) && data.cantidad_kg > 0) data.cantidad_qq = data.cantidad_kg / 46;
    if (!(data.cantidad_kg > 0) && data.cantidad_qq > 0) data.cantidad_kg = data.cantidad_qq * 46;
    if (!(data.cantidad_qq > 0)) throw new Error('La cantidad vendida debe ser mayor que cero.');
    if (!(data.precio_por_qq > 0) && data.precio_por_kg > 0) data.precio_por_qq = data.precio_por_kg * 46;
    if (!(data.precio_por_kg > 0) && data.precio_por_qq > 0) data.precio_por_kg = data.precio_por_qq / 46;
    if (!(data.precio_por_qq > 0)) throw new Error('Registre el precio de venta por kilogramo o por quintal.');
    if (SQL.get('SELECT id FROM ventas_cafe WHERE UPPER(codigo)=UPPER(?)', data.codigo)) throw new Error('Ya existe una venta con ese código.');
    const available = data.lote_id
        ? currentInventoryStock(data.tipo_producto, data.lote_id)
        : Number((SQL.get(`SELECT COALESCE(SUM(CASE WHEN tipo_movimiento='entrada' THEN cantidad_qq ELSE -cantidad_qq END),0) AS saldo
            FROM inventario WHERE tipo_producto=? AND lote_id IS NULL`, data.tipo_producto) || {}).saldo || 0);
    if (data.cantidad_qq > available + 0.0001) throw new Error(`Inventario insuficiente. Disponible: ${available.toFixed(2)} qq; solicitado: ${data.cantidad_qq.toFixed(2)} qq.`);
    data.total_venta = Math.round(data.cantidad_qq * data.precio_por_qq * 100) / 100;
    db.run('BEGIN TRANSACTION');
    try {
        const movement = SQL.insertObj('inventario', {
            tipo_producto: data.tipo_producto, lote_id: data.lote_id, tipo_movimiento: 'venta',
            cantidad_qq: data.cantidad_qq, cantidad_kg: data.cantidad_kg,
            fecha_movimiento: data.fecha, cliente_destino: data.cliente,
            precio_venta_qq: data.precio_por_qq, total_venta: data.total_venta,
            factura: data.factura, observaciones: `Venta ${data.codigo}${data.observaciones ? ` · ${data.observaciones}` : ''}`
        });
        data.inventario_id = movement.lastInsertRowid;
        data.estado = 'confirmada';
        const sale = SQL.insertObj('ventas_cafe', data);
        db.run('COMMIT'); guardarDB();
        return { id: sale.lastInsertRowid, inventario_id: movement.lastInsertRowid, total_venta: data.total_venta, disponible_restante_qq: available - data.cantidad_qq };
    } catch (error) {
        try { db.run('ROLLBACK'); } catch (rollbackError) { console.warn('Rollback de venta omitido:', rollbackError.message); }
        throw error;
    }
});

secureHandle('ventasCafe:cancel', (event, id) => {
    const sale = SQL.get('SELECT * FROM ventas_cafe WHERE id = ?', id);
    if (!sale) throw new Error('La venta no existe.');
    if (sale.estado === 'anulada') return sale;
    db.run('BEGIN TRANSACTION');
    try {
        SQL.run("UPDATE ventas_cafe SET estado='anulada', inventario_id=NULL WHERE id=?", id);
        if (sale.inventario_id) SQL.run('DELETE FROM inventario WHERE id = ?', sale.inventario_id);
        db.run('COMMIT'); guardarDB();
        return SQL.get('SELECT * FROM ventas_cafe WHERE id = ?', id);
    } catch (error) {
        try { db.run('ROLLBACK'); } catch (rollbackError) { console.warn('Rollback de anulación omitido:', rollbackError.message); }
        throw error;
    }
});

// Gastos
secureHandle('gastos:getAll', (event, filtros) => {
    let sql = `SELECT g.*, l.codigo as lote_codigo FROM gastos g 
        LEFT JOIN lotes l ON g.lote_id = l.id WHERE 1=1`;
    const params = [];
    if (filtros) {
        if (filtros.fechaIni) { sql += ' AND g.fecha >= ?'; params.push(filtros.fechaIni); }
        if (filtros.fechaFin) { sql += ' AND g.fecha <= ?'; params.push(filtros.fechaFin); }
        if (filtros.categoria) { sql += ' AND g.categoria = ?'; params.push(filtros.categoria); }
        if (filtros.lote_id) { sql += ' AND g.lote_id = ?'; params.push(filtros.lote_id); }
    }
    sql += ' ORDER BY g.fecha DESC';
    return SQL.query(sql, ...params);
});

secureHandle('gastos:create', (event, data) => {
    data = validateEntity('gasto', data);
    if (data.lote_id) assertActiveLote(data.lote_id);
    if (data.cantidad && data.costo_unitario) {
        data.costo_total = data.cantidad * data.costo_unitario;
    }
    const result = SQL.insertObj('gastos', data);
    guardarDB();
    return result;
});

secureHandle('gastos:delete', (event, id) => {
    SQL.run('DELETE FROM gastos WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
});

secureHandle('gastos:resumen', (event, fechaIni, fechaFin) => 
    SQL.query(`SELECT categoria, COALESCE(SUM(costo_total), 0) as total
        FROM gastos WHERE fecha >= ? AND fecha <= ?
        GROUP BY categoria ORDER BY total DESC`, fechaIni, fechaFin));

secureHandle('gastos:total', (event, fechaIni, fechaFin) => 
    SQL.get(`SELECT COALESCE(SUM(costo_total), 0) as total
        FROM gastos WHERE fecha >= ? AND fecha <= ?`, fechaIni, fechaFin));

secureHandle('gastos:getCategorias', () => 
    ['fertilizante','fungicida','herbicida','mano_obra','transporte','insumos','maquinaria','mantenimiento','servicios','otros']);

// ★ FLUJO 2: Conexión Cosecha → Beneficio
// Resumen de cosecha por lote en un período (para cargar al beneficio)
secureHandle('cosecha:getResumenPorPeriodo', (event, fechaIni, fechaFin) =>
    SQL.query(`SELECT c.lote_id, l.codigo as lote_codigo,
        SUM(c.latas_recolectadas) as total_latas,
        SUM(c.kilos_estimados) as total_kilos,
        COUNT(DISTINCT c.fecha) as dias_corte,
        COUNT(*) as total_registros
        FROM recoleccion c JOIN lotes l ON c.lote_id = l.id
        WHERE c.fecha >= ? AND c.fecha <= ? AND l.activo = 1
        GROUP BY c.lote_id ORDER BY l.codigo`, fechaIni, fechaFin));

// ★ FLUJO 3: Ficha completa de Lote (historial)
secureHandle('lotes:getHistorial', (event, id) => {
    const lote = SQL.get(`SELECT l.*, v.nombre as variedad_nombre
        FROM lotes l LEFT JOIN variedades v ON l.variedad_id = v.id WHERE l.id = ?`, id);
    const cosechas = SQL.query(`SELECT c.*, r.nombre_completo as recolector_nombre
        FROM recoleccion c LEFT JOIN recolectores r ON c.recolector_id = r.id
        WHERE c.lote_id = ? ORDER BY c.fecha DESC LIMIT 30`, id);
    const beneficios = SQL.query(`SELECT * FROM beneficio WHERE lote_id = ? ORDER BY fecha_inicio DESC LIMIT 20`, id);
    const gastos = SQL.query(`SELECT * FROM gastos WHERE lote_id = ? ORDER BY fecha DESC LIMIT 30`, id);
    const inventario = SQL.query(`SELECT * FROM inventario WHERE lote_id = ? ORDER BY fecha_movimiento DESC LIMIT 20`, id);
    const resumen = SQL.get(`SELECT COUNT(*) as total_cortes,
        COALESCE(SUM(latas_recolectadas),0) as total_latas,
        COALESCE(SUM(kilos_estimados),0) as total_kilos,
        COALESCE(SUM(total_pagado),0) as total_pagado_cosecha
        FROM recoleccion WHERE lote_id = ?`, id);
    return { lote, cosechas, beneficios, gastos, inventario, resumen };
});

// ★ FLUJO 4: Ranking de Recolectores
secureHandle('recolectores:getRanking', (event, fechaIni, fechaFin, limite = 10) =>
    SQL.query(`SELECT r.id, r.nombre_completo,
        COUNT(c.id) as total_cortes,
        COALESCE(SUM(c.latas_recolectadas), 0) as total_latas,
        COALESCE(SUM(c.kilos_estimados), 0) as total_kilos,
        COALESCE(SUM(c.total_pagado), 0) as total_pagado,
        CASE WHEN COUNT(c.id) > 0 THEN ROUND(AVG(c.kilos_estimados / NULLIF(c.latas_recolectadas, 0)), 1) ELSE 0 END as peso_promedio_lata
        FROM recolectores r
        LEFT JOIN recoleccion c ON c.recolector_id = r.id AND c.fecha >= ? AND c.fecha <= ?
        GROUP BY r.id
        ORDER BY total_kilos DESC
        LIMIT ?`, fechaIni, fechaFin, limite));

// ─── TEMPORADAS Y PLANILLAS SEMANALES DE CORTE ─────────────────────
function mondayOf(dateText) {
    const date = new Date(`${dateText}T12:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error('La fecha de semana no es válida.');
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
}

function plusDays(dateText, days) {
    const date = new Date(`${dateText}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function getActiveSeasonFor(dateText) {
    return SQL.get(`SELECT * FROM temporadas_cafe
        WHERE fecha_inicio <= ? AND fecha_fin >= ?
        ORDER BY CASE estado WHEN 'activa' THEN 0 WHEN 'planificada' THEN 1 ELSE 2 END, fecha_inicio DESC LIMIT 1`, dateText, dateText);
}

secureHandle('temporadas:getAll', () => SQL.query('SELECT * FROM temporadas_cafe ORDER BY fecha_inicio DESC'));
secureHandle('temporadas:create', (event, data) => {
    data = validateEntity('temporada', data);
    const result = SQL.insertObj('temporadas_cafe', data);
    guardarDB();
    return result;
});

secureHandle('planillas:getWeek', (event, { loteId, weekStart }) => {
    const monday = mondayOf(weekStart || new Date().toISOString().slice(0, 10));
    const planilla = SQL.get('SELECT * FROM planillas_corte WHERE lote_id = ? AND semana_inicio = ?', loteId, monday);
    const entries = planilla ? SQL.query(`SELECT r.id, r.recolector_id, r.fecha, r.cantidad_unidad,
        r.unidad_corte, r.latas_recolectadas, r.kilos_estimados, r.total_pagado
        FROM recoleccion r WHERE r.planilla_id = ? ORDER BY r.fecha, r.recolector_id`, planilla.id) : [];
    const season = getActiveSeasonFor(monday);
    return { planilla, entries, season, weekStart: monday };
});

secureHandle('planillas:list', () => SQL.query(`SELECT p.*, l.codigo AS lote_codigo, t.nombre AS temporada_nombre,
    COUNT(r.id) AS registros, COALESCE(SUM(r.kilos_estimados),0) AS kilos,
    COALESCE(SUM(r.total_pagado),0) AS total_pagado
    FROM planillas_corte p JOIN lotes l ON p.lote_id = l.id
    LEFT JOIN temporadas_cafe t ON p.temporada_id = t.id
    LEFT JOIN recoleccion r ON r.planilla_id = p.id
    GROUP BY p.id ORDER BY p.semana_inicio DESC LIMIT 100`));

secureHandle('planillas:getProfitability', (event, limit = 12) => {
    const planillas = SQL.query(`SELECT p.*, l.codigo AS lote_codigo, t.nombre AS temporada_nombre,
        COUNT(r.id) AS registros, COUNT(DISTINCT r.recolector_id) AS cortadores,
        COALESCE(SUM(r.cantidad_unidad),0) AS cantidad_unidad,
        COALESCE(SUM(r.kilos_estimados),0) AS kilos_cereza,
        COALESCE(SUM(r.total_pagado),0) AS pago_cortadores
        FROM planillas_corte p JOIN lotes l ON p.lote_id=l.id
        LEFT JOIN temporadas_cafe t ON p.temporada_id=t.id
        LEFT JOIN recoleccion r ON r.planilla_id=p.id
        GROUP BY p.id ORDER BY p.semana_inicio DESC LIMIT ?`, Math.min(100, Math.max(1, Number(limit || 12))));
    return planillas.map(planilla => {
        const processEnd = plusDays(planilla.semana_fin, 45);
        const salesEnd = plusDays(planilla.semana_fin, 180);
        const benefit = SQL.get(`SELECT COALESCE(SUM(kilos_cereza_ingresados),0) cereza_procesada,
            COALESCE(SUM(kilos_pergamino_seco),0) pergamino, ROUND(AVG(rendimiento_porcentaje),2) rendimiento
            FROM beneficio WHERE lote_id=? AND fecha_inicio BETWEEN ? AND ?`, planilla.lote_id, planilla.semana_inicio, processEnd) || {};
        const expenses = Number((SQL.get(`SELECT COALESCE(SUM(costo_total),0) total FROM gastos WHERE lote_id=? AND fecha BETWEEN ? AND ?`, planilla.lote_id, planilla.semana_inicio, processEnd) || {}).total || 0);
        const sales = Number((SQL.get(`SELECT COALESCE(SUM(total_venta),0) total FROM inventario WHERE lote_id=? AND tipo_movimiento='venta' AND fecha_movimiento BETWEEN ? AND ?`, planilla.lote_id, planilla.semana_inicio, salesEnd) || {}).total || 0);
        const directCost = Number(planilla.pago_cortadores || 0) + expenses;
        const pergamino = Number(benefit.pergamino || 0);
        return {
            ...planilla, beneficio_hasta: processEnd, ventas_hasta: salesEnd,
            kilos_pergamino: pergamino, rendimiento_estimado: Number(benefit.rendimiento || 0),
            gastos_lote_periodo: expenses, ventas_lote_periodo: sales,
            costo_directo_estimado: directCost,
            costo_directo_por_kg_pergamino: pergamino > 0 ? directCost / pergamino : null,
            margen_estimado: sales > 0 ? sales - directCost : null,
            es_estimacion: true,
            criterio: 'Costos y ventas del mismo lote dentro de ventanas posteriores a la semana; no sustituye trazabilidad financiera por lote de venta.'
        };
    });
});

secureHandle('planillas:saveWeek', (event, payload = {}) => {
    const loteId = Number(payload.loteId);
    const lote = assertActiveLote(loteId);
    const weekStart = mondayOf(payload.weekStart || new Date().toISOString().slice(0, 10));
    const days = Math.min(7, Math.max(1, Number(payload.days || 5)));
    const weekEnd = plusDays(weekStart, days - 1);
    const unit = ['lata','kg','canasta'].includes(payload.unit) ? payload.unit : 'lata';
    const price = Number(payload.price || 0);
    const weight = Number(payload.weight || 18);
    if (!Number.isFinite(price) || price < 0) throw new Error('El precio por unidad debe ser válido.');
    if (!Number.isFinite(weight) || weight <= 0 || weight > 100) throw new Error('El peso de referencia debe estar entre 1 y 100 kg.');
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    if (!rows.length) throw new Error('Agregue al menos un recolector a la planilla.');
    const pickerIds = new Set(SQL.query('SELECT id FROM recolectores WHERE activo = 1').map(row => Number(row.id)));
    const season = getActiveSeasonFor(weekStart);

    db.run('BEGIN TRANSACTION');
    try {
        let planilla = SQL.get('SELECT * FROM planillas_corte WHERE lote_id = ? AND semana_inicio = ?', loteId, weekStart);
        const planillaData = {
            temporada_id: season?.id || null, lote_id: loteId, semana_inicio: weekStart, semana_fin: weekEnd,
            unidad: unit, precio_por_unidad: price, peso_lata_kg: weight, dias_semana: days,
            estado: payload.status || 'confirmada', observaciones: String(payload.notes || '').trim() || null,
            updated_at: new Date().toISOString()
        };
        if (planilla) SQL.update('planillas_corte', planillaData, planilla.id);
        else {
            const result = SQL.insertObj('planillas_corte', planillaData);
            planilla = { id: result.lastInsertRowid };
        }

        for (const row of rows) {
            const pickerId = Number(row.recolectorId);
            if (!pickerIds.has(pickerId)) throw new Error(`El recolector de la fila ${row.name || pickerId} no existe o está inactivo.`);
            const values = Array.isArray(row.values) ? row.values : [];
            for (let index = 0; index < days; index++) {
                const date = plusDays(weekStart, index);
                const quantity = Number(values[index] || 0);
                if (!Number.isFinite(quantity) || quantity < 0) throw new Error(`La cantidad de ${row.name || 'recolector'} para ${date} no es válida.`);
                const existing = SQL.get('SELECT id FROM recoleccion WHERE planilla_id = ? AND recolector_id = ? AND fecha = ?', planilla.id, pickerId, date);
                if (quantity <= 0) {
                    if (existing) SQL.run('DELETE FROM recoleccion WHERE id = ?', existing.id);
                    continue;
                }
                const kilos = unit === 'kg' ? quantity : quantity * weight;
                const latas = unit === 'lata' ? quantity : kilos / weight;
                const total = quantity * price;
                const data = {
                    lote_id: loteId, fecha: date, recolector_id: pickerId,
                    latas_recolectadas: Math.round(latas * 10000) / 10000,
                    kilos_estimados: Math.round(kilos * 100) / 100,
                    peso_lata_kg: weight, tipo_madurez: payload.maturity || 'maduro',
                    precio_por_lata: unit === 'kg' ? price * weight : price,
                    total_pagado: Math.round(total * 100) / 100,
                    observaciones: `Planilla semanal ${weekStart} · ${unit}`,
                    planilla_id: planilla.id, unidad_corte: unit, cantidad_unidad: quantity
                };
                if (existing) SQL.update('recoleccion', data, existing.id);
                else SQL.insertObj('recoleccion', data);
            }
        }
        db.run('COMMIT');
        guardarDB();
        const totals = SQL.get(`SELECT COUNT(*) registros, COALESCE(SUM(kilos_estimados),0) kilos,
            COALESCE(SUM(total_pagado),0) total_pagado FROM recoleccion WHERE planilla_id = ?`, planilla.id);
        return { id: planilla.id, lote: lote.codigo, weekStart, weekEnd, ...totals };
    } catch (error) {
        try { db.run('ROLLBACK'); } catch { /* no-op */ }
        throw error;
    }
});

// ─── ACOPIO Y COMPRAS DE CAFÉ ─────────────────────────────────────
function purchaseCode() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const row = SQL.get("SELECT COUNT(*) AS total FROM compras_cafe WHERE fecha = date('now','localtime')");
    return `CMP-${date}-${String(Number(row?.total || 0) + 1).padStart(3, '0')}`;
}

function ensureSystemAcopioLot() {
    let finca = SQL.get('SELECT id FROM finca WHERE activo = 1 LIMIT 1');
    if (!finca) {
        const result = SQL.insertObj('finca', { nombre: 'Centro de acopio', ubicacion: 'Honduras', area_total_mz: 0, area_cafe_mz: 0, activo: 1 });
        finca = { id: result.lastInsertRowid };
    }
    let lot = SQL.get("SELECT * FROM lotes WHERE codigo = 'ACOPIO-EXTERNO' AND activo = 1 LIMIT 1");
    if (!lot) {
        const result = SQL.insertObj('lotes', {
            finca_id: finca.id, codigo: 'ACOPIO-EXTERNO', area_mz: 0.01, estado: 'produccion',
            observaciones: 'Lote técnico oculto para procesar café comprado a terceros.', es_sistema: 1, activo: 1
        });
        lot = SQL.get('SELECT * FROM lotes WHERE id = ?', result.lastInsertRowid);
    }
    return lot;
}

function enforcePurchaseQualityPolicy(purchase, status = purchase.estado_calidad) {
    const qualityRequired = (SQL.get("SELECT valor FROM configuracion WHERE clave = 'compra_control_calidad'") || {}).valor !== '0';
    if (!qualityRequired || !['aprobado','condicionado'].includes(status)) return;
    if (purchase.defectos_porcentaje == null) throw new Error('Registre el porcentaje de defectos antes de aprobar o condicionar la compra.');
    if (['pergamino_seco','verde'].includes(purchase.tipo_producto) && purchase.humedad_porcentaje == null) {
        throw new Error('Registre la humedad del café seco o verde antes de incorporarlo al inventario.');
    }
}

function approvePurchaseRecord(id, status = 'aprobado') {
    if (!['aprobado','condicionado','rechazado','pendiente'].includes(status)) throw new Error('Estado de recepción inválido.');
    const purchase = SQL.get('SELECT * FROM compras_cafe WHERE id = ?', id);
    if (!purchase) throw new Error('La compra no existe.');
    enforcePurchaseQualityPolicy(purchase, status);
    if (purchase.inventario_id && status === 'rechazado') throw new Error('La compra ya generó inventario y no puede rechazarse sin reversar el movimiento.');
    let inventoryId = purchase.inventario_id;
    if (!inventoryId && ['aprobado','condicionado'].includes(status)) {
        const result = SQL.insertObj('inventario', {
            tipo_producto: purchase.tipo_producto, tipo_movimiento: 'entrada', cantidad_qq: purchase.cantidad_qq,
            cantidad_kg: purchase.cantidad_kg, fecha_movimiento: purchase.fecha,
            ubicacion: purchase.ubicacion_recepcion || 'Recepción de compras', compra_id: purchase.id,
            costo_origen: purchase.costo_total, observaciones: `Compra ${purchase.codigo} aprobada para inventario.`
        });
        inventoryId = result.lastInsertRowid;
    }
    SQL.run('UPDATE compras_cafe SET estado_calidad = ?, inventario_id = ? WHERE id = ?', status, inventoryId || null, id);
    guardarDB();
    return SQL.get(`SELECT c.*, p.nombre proveedor_nombre FROM compras_cafe c JOIN proveedores_cafe p ON c.proveedor_id = p.id WHERE c.id = ?`, id);
}

secureHandle('proveedoresCafe:getAll', () => SQL.query('SELECT * FROM proveedores_cafe WHERE activo = 1 ORDER BY nombre'));
secureHandle('proveedoresCafe:create', (event, data) => {
    data = validateEntity('proveedor_cafe', data);
    if (!data.codigo) data.codigo = `PRV-${String(Number((SQL.get('SELECT COUNT(*) total FROM proveedores_cafe') || {}).total || 0) + 1).padStart(4, '0')}`;
    if (SQL.get('SELECT id FROM proveedores_cafe WHERE UPPER(codigo) = UPPER(?)', data.codigo)) throw new Error('Ya existe un proveedor con ese código.');
    const result = SQL.insertObj('proveedores_cafe', data); guardarDB(); return result;
});

secureHandle('comprasCafe:getAll', (event, filters = {}) => {
    const conditions = ['1=1']; const params = [];
    if (filters.tipo_producto) { conditions.push('c.tipo_producto = ?'); params.push(filters.tipo_producto); }
    if (filters.estado_calidad) { conditions.push('c.estado_calidad = ?'); params.push(filters.estado_calidad); }
    return SQL.query(`SELECT c.*, p.nombre proveedor_nombre, p.tipo proveedor_tipo
        FROM compras_cafe c JOIN proveedores_cafe p ON c.proveedor_id = p.id
        WHERE ${conditions.join(' AND ')} ORDER BY c.fecha DESC, c.id DESC LIMIT 500`, ...params);
});
secureHandle('comprasCafe:getSummary', () => SQL.get(`SELECT COUNT(*) total_compras,
    COALESCE(SUM(cantidad_kg),0) kilos, COALESCE(SUM(costo_total),0) inversion,
    COALESCE(SUM(CASE WHEN estado_calidad = 'pendiente' THEN 1 ELSE 0 END),0) pendientes
    FROM compras_cafe`));
secureHandle('comprasCafe:nextCode', () => purchaseCode());
secureHandle('comprasCafe:create', (event, data) => {
    data = validateEntity('compra_cafe', data);
    enforcePurchaseQualityPolicy(data, data.estado_calidad);
    if (!SQL.get('SELECT id FROM proveedores_cafe WHERE id = ? AND activo = 1', data.proveedor_id)) throw new Error('El proveedor seleccionado no existe o está inactivo.');
    if (SQL.get('SELECT id FROM compras_cafe WHERE UPPER(codigo) = UPPER(?)', data.codigo)) throw new Error('Ya existe una compra con ese código.');
    const warning = data.advertencia_calidad;
    delete data.advertencia_calidad;
    const result = SQL.insertObj('compras_cafe', data);
    if (['aprobado','condicionado'].includes(data.estado_calidad)) approvePurchaseRecord(result.lastInsertRowid, data.estado_calidad);
    guardarDB();
    return { ...result, warning };
});
secureHandle('comprasCafe:setStatus', (event, id, status) => approvePurchaseRecord(id, status));
secureHandle('comprasCafe:updateQuality', (event, id, quality = {}) => {
    const purchase = SQL.get('SELECT * FROM compras_cafe WHERE id = ?', id);
    if (!purchase) throw new Error('La compra no existe.');
    const normalized = validateEntity('compra_cafe', {
        ...purchase,
        humedad_porcentaje: quality.humedad_porcentaje,
        defectos_porcentaje: quality.defectos_porcentaje,
        estado_calidad: quality.estado_calidad || purchase.estado_calidad,
        observaciones: quality.observaciones ?? purchase.observaciones
    });
    enforcePurchaseQualityPolicy(normalized, normalized.estado_calidad);
    if (normalized.estado_calidad === 'rechazado' && purchase.inventario_id) throw new Error('La compra ya generó inventario y no puede rechazarse sin reversar el movimiento.');
    SQL.update('compras_cafe', {
        humedad_porcentaje: normalized.humedad_porcentaje,
        defectos_porcentaje: normalized.defectos_porcentaje,
        observaciones: normalized.observaciones,
        estado_calidad: normalized.estado_calidad
    }, id);
    if (['aprobado','condicionado'].includes(normalized.estado_calidad)) return approvePurchaseRecord(id, normalized.estado_calidad);
    guardarDB();
    return SQL.get(`SELECT c.*, p.nombre proveedor_nombre FROM compras_cafe c JOIN proveedores_cafe p ON c.proveedor_id = p.id WHERE c.id = ?`, id);
});
secureHandle('comprasCafe:sendToBenefit', (event, id, processData = {}) => {
    const purchase = SQL.get('SELECT * FROM compras_cafe WHERE id = ?', id);
    if (!purchase) throw new Error('La compra no existe.');
    if (!['cereza','pergamino_humedo'].includes(purchase.tipo_producto)) throw new Error('Solo café cereza o pergamino húmedo puede enviarse a beneficio húmedo.');
    if (!purchase.inventario_id) throw new Error('Apruebe la recepción antes de enviarla a beneficio.');
    if (SQL.get('SELECT id FROM beneficio WHERE compra_id = ? LIMIT 1', purchase.id)) throw new Error('Esta compra ya fue enviada a beneficio. Revise el proceso existente antes de continuar.');
    const inputKg = Number(processData.kilos_cereza_ingresados || purchase.cantidad_kg);
    const outputKg = Number(processData.kilos_pergamino_seco || 0);
    if (!(inputKg > 0) || !(outputKg > 0) || outputKg > inputKg) throw new Error('Revise los kilos de entrada y de pergamino seco obtenidos.');
    const lot = ensureSystemAcopioLot();
    const data = validateEntity('beneficio', {
        lote_id: lot.id, fecha_inicio: processData.fecha_inicio || purchase.fecha,
        fecha_fin: processData.fecha_fin || processData.fecha_inicio || purchase.fecha,
        kilos_cereza_ingresados: inputKg, kilos_pergamino_seco: outputKg,
        metodo: processData.metodo || 'lavado', horas_fermentacion: processData.horas_fermentacion,
        tipo_secado: processData.tipo_secado || 'sol', dias_secado: processData.dias_secado,
        humedad_final_porcentaje: processData.humedad_final_porcentaje,
        observaciones: processData.observaciones || `Procesado desde compra ${purchase.codigo}`,
        compra_id: purchase.id, origen_tipo: 'comprado'
    });
    data.compra_id = purchase.id; data.origen_tipo = 'comprado';
    db.run('BEGIN TRANSACTION');
    try {
        const result = SQL.insertObj('beneficio', data);
        SQL.insertObj('inventario', {
            tipo_producto: purchase.tipo_producto, tipo_movimiento: 'salida', cantidad_qq: inputKg / 46,
            cantidad_kg: inputKg, fecha_movimiento: data.fecha_inicio, compra_id: purchase.id,
            observaciones: `Materia prima consumida por beneficio #${result.lastInsertRowid}`
        });
        SQL.insertObj('inventario', {
            tipo_producto: 'pergamino_seco', lote_id: lot.id, beneficio_id: result.lastInsertRowid,
            tipo_movimiento: 'entrada', cantidad_qq: outputKg / 46, cantidad_kg: outputKg,
            fecha_movimiento: data.fecha_fin || data.fecha_inicio, compra_id: purchase.id,
            costo_origen: purchase.costo_total, ubicacion: 'Beneficio',
            observaciones: `Resultado de compra ${purchase.codigo}`
        });
        db.run('COMMIT'); guardarDB(); return result;
    } catch (error) { try { db.run('ROLLBACK'); } catch (rollbackError) { console.warn('Rollback omitido:', rollbackError.message); } throw error; }
});

// ─── REGISTRO MASIVO ATÓMICO ──────────────────────────────────────
function normalizeBulkRow(entity, raw) {
    const row = { ...raw };
    if (entity === 'lote') {
        const normalized = validateEntity('lote', row);
        normalized.finca_id = requireActiveFinca().id;
        return normalized;
    }
    if (entity === 'recolector') return validateEntity('recolector', row);
    if (entity === 'cosecha') return validateEntity('cosecha', row);
    if (entity === 'beneficio') return validateEntity('beneficio', row);
    if (entity === 'inventario') return validateEntity('inventario', row);
    if (entity === 'gasto') return validateEntity('gasto', row);
    if (entity === 'proveedor_cafe') return validateEntity('proveedor_cafe', row);
    if (entity === 'compra_cafe') {
        const normalized = validateEntity('compra_cafe', row);
        enforcePurchaseQualityPolicy(normalized, normalized.estado_calidad);
        return normalized;
    }
    if (entity === 'clima') return validateEntity('clima', row);
    if (entity === 'calidad') return validateEntity('calidad', row);
    throw new Error(`La entidad masiva ${entity} no está permitida.`);
}

function validateBulkRelations(entity, row) {
    if (['cosecha','beneficio','calidad'].includes(entity)) assertActiveLote(row.lote_id);
    if (entity === 'lote') { assertLoteCodeAvailable(row.codigo); }
    if (entity === 'cosecha' && row.recolector_id && !SQL.get('SELECT id FROM recolectores WHERE id = ? AND activo = 1', row.recolector_id)) throw new Error('Recolector inválido.');
    if (entity === 'inventario' && row.lote_id) assertActiveLote(row.lote_id);
    if (entity === 'gasto' && row.lote_id) assertActiveLote(row.lote_id);
    if (entity === 'compra_cafe' && !SQL.get('SELECT id FROM proveedores_cafe WHERE id = ? AND activo = 1', row.proveedor_id)) throw new Error('Proveedor inválido.');
}

function validateBulkPayload(entity, rows) {
    const result = []; const codes = new Set(); let areaToAdd = 0;
    const stockProjection = new Map();
    rows.forEach((raw, index) => {
        try {
            const normalized = normalizeBulkRow(entity, raw);
            if (entity === 'lote') {
                const key = String(normalized.codigo).toUpperCase();
                if (codes.has(key)) throw new Error('Código repetido dentro de la tabla masiva.');
                codes.add(key); areaToAdd += Number(normalized.area_mz || 0);
            }
            if (entity === 'proveedor_cafe' && normalized.codigo) {
                const key = String(normalized.codigo).toUpperCase();
                if (codes.has(key) || SQL.get('SELECT id FROM proveedores_cafe WHERE UPPER(codigo) = ?', key)) throw new Error('Código de proveedor repetido.');
                codes.add(key);
            }
            if (entity === 'compra_cafe') {
                const key = String(normalized.codigo).toUpperCase();
                if (codes.has(key) || SQL.get('SELECT id FROM compras_cafe WHERE UPPER(codigo) = ?', key)) throw new Error('Código de compra repetido.');
                codes.add(key);
            }
            validateBulkRelations(entity, normalized);
            if (entity === 'inventario') {
                const key = `${normalized.tipo_producto}:${normalized.lote_id || 'global'}`;
                if (!stockProjection.has(key)) stockProjection.set(key, currentInventoryStock(normalized.tipo_producto, normalized.lote_id || null));
                const current = stockProjection.get(key);
                const delta = normalized.tipo_movimiento === 'entrada' ? normalized.cantidad_qq : -normalized.cantidad_qq;
                if (current + delta < -0.001) throw new Error(`Existencias insuficientes dentro del bloque: disponibles ${current.toFixed(2)} qq y solicitados ${normalized.cantidad_qq.toFixed(2)} qq.`);
                stockProjection.set(key, current + delta);
            }
            result.push({ index, valid: true, normalized, errors: [], warnings: normalized.advertencia_calidad ? [normalized.advertencia_calidad] : [] });
        } catch (error) { result.push({ index, valid: false, normalized: raw, errors: [error.message], warnings: [] }); }
    });
    if (entity === 'lote' && result.every(row => row.valid)) {
        try { assertLoteAreaCapacity(areaToAdd); } catch (error) { result.forEach(row => { row.valid = false; row.errors.push(error.message); }); }
    }
    return result;
}

secureHandle('bulk:validate', (event, entity, rows = []) => validateBulkPayload(entity, rows));
secureHandle('bulk:save', (event, entity, rows = []) => {
    const filtered = rows.filter(row => Object.values(row || {}).some(value => String(value ?? '').trim() !== ''));
    if (!filtered.length) throw new Error('No hay filas con información para guardar.');
    const validation = validateBulkPayload(entity, filtered);
    if (validation.some(row => !row.valid)) return { ok: false, validation };
    db.run('BEGIN TRANSACTION');
    try {
        const ids = [];
        for (const item of validation) {
            const row = item.normalized; let result;
            if (entity === 'lote') result = SQL.insertObj('lotes', row);
            else if (entity === 'recolector') result = SQL.insertObj('recolectores', row);
            else if (entity === 'cosecha') result = SQL.insertObj('recoleccion', row);
            else if (entity === 'beneficio') {
                result = SQL.insertObj('beneficio', row);
                if (row.kilos_pergamino_seco > 0) SQL.insertObj('inventario', {
                    tipo_producto: 'pergamino_seco', lote_id: row.lote_id, beneficio_id: result.lastInsertRowid,
                    tipo_movimiento: 'entrada', cantidad_qq: row.kilos_pergamino_seco / 46,
                    cantidad_kg: row.kilos_pergamino_seco, fecha_movimiento: row.fecha_fin || row.fecha_inicio,
                    ubicacion: 'Beneficio', observaciones: `Auto-generado desde carga masiva #${result.lastInsertRowid}`
                });
            } else if (entity === 'inventario') result = SQL.insertObj('inventario', row);
            else if (entity === 'gasto') result = SQL.insertObj('gastos', row);
            else if (entity === 'proveedor_cafe') {
                if (!row.codigo) row.codigo = `PRV-${String(Number((SQL.get('SELECT COUNT(*) total FROM proveedores_cafe') || {}).total || 0) + 1).padStart(4, '0')}`;
                result = SQL.insertObj('proveedores_cafe', row);
            }
            else if (entity === 'compra_cafe') {
                const warning = row.advertencia_calidad; delete row.advertencia_calidad;
                result = SQL.insertObj('compras_cafe', row);
                if (['aprobado','condicionado'].includes(row.estado_calidad)) {
                    const inventory = SQL.insertObj('inventario', {
                        tipo_producto: row.tipo_producto, tipo_movimiento: 'entrada', cantidad_qq: row.cantidad_qq,
                        cantidad_kg: row.cantidad_kg, fecha_movimiento: row.fecha,
                        ubicacion: row.ubicacion_recepcion || 'Recepción de compras', compra_id: result.lastInsertRowid,
                        costo_origen: row.costo_total, observaciones: `Compra masiva ${row.codigo} incorporada al inventario.`
                    });
                    SQL.run('UPDATE compras_cafe SET inventario_id = ? WHERE id = ?', inventory.lastInsertRowid, result.lastInsertRowid);
                }
                if (warning) item.warning = warning;
            }
            else if (entity === 'clima') result = SQL.insertObj('registros_clima', row);
            else if (entity === 'calidad') result = SQL.insertObj('calidad_evaluaciones', row);
            ids.push(result.lastInsertRowid);
        }
        db.run('COMMIT'); guardarDB(); return { ok: true, count: ids.length, ids, validation };
    } catch (error) { try { db.run('ROLLBACK'); } catch (rollbackError) { console.warn('Rollback omitido:', rollbackError.message); } throw error; }
});


// Dashboard
secureHandle('dashboard:getStats', () => {
    const totalLotes = (SQL.get('SELECT COUNT(*) as c FROM lotes WHERE activo=1 AND COALESCE(es_sistema,0)=0') || {}).c || 0;
    const areaTotal = (SQL.get('SELECT COALESCE(SUM(area_mz),0) as t FROM lotes WHERE activo=1 AND COALESCE(es_sistema,0)=0') || {}).t || 0;
    const cosechaMes = SQL.get(`SELECT COALESCE(SUM(latas_recolectadas),0) as latas, 
        COALESCE(SUM(kilos_estimados),0) as kilos FROM recoleccion 
        WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`) || { latas: 0, kilos: 0 };
    const gastosAnio = (SQL.get(`SELECT COALESCE(SUM(costo_total),0) as t FROM gastos 
        WHERE strftime('%Y', fecha) = strftime('%Y', 'now')`) || {}).t || 0;
    const inventarioTotal = (SQL.get(`SELECT COALESCE(SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad_qq ELSE -cantidad_qq END),0) as t
        FROM inventario`) || {}).t || 0;
    return { totalLotes, areaTotal, cosechaMes: cosechaMes.latas, kilosMes: cosechaMes.kilos, gastosAnio, inventarioTotal };
});

// Configuración institucional y exportación PDF
function getConfigurationMap() {
    return Object.fromEntries(SQL.query('SELECT clave, valor FROM configuracion ORDER BY clave').map(item => [item.clave, item.valor]));
}

const reportConfigurationRules = {
    reporte_nombre_organizacion: { required: true, max: 120 },
    reporte_identificacion: { max: 80 },
    reporte_direccion: { max: 180 },
    reporte_telefono: { max: 40, pattern: /^[0-9+()\-\s.]{7,40}$/, message: 'El teléfono institucional tiene un formato inválido.' },
    reporte_email: { max: 120, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'El correo institucional tiene un formato inválido.' },
    reporte_sitio_web: { max: 160, pattern: /^https?:\/\/[^\s]+$/i, message: 'El sitio web debe comenzar con http:// o https://.' },
    reporte_responsable: { max: 100 },
    reporte_logo_path: { max: 500 },
    reporte_color_primario: { pattern: /^#[0-9a-f]{6}$/i, message: 'El color principal debe usar formato hexadecimal #RRGGBB.' },
    reporte_color_secundario: { pattern: /^#[0-9a-f]{6}$/i, message: 'El color secundario debe usar formato hexadecimal #RRGGBB.' },
    reporte_pie: { max: 240 },
    reporte_mostrar_logo: { values: ['0', '1'] },
    operacion_tipo: { values: ['productor','comprador','mixta'] },
    cosecha_dias_semana: { values: ['5','6','7'] },
    compra_control_calidad: { values: ['0','1'] },
    reporte_logo_predeterminado: { values: ['cafetal-os'] },
    clima_proveedor: { values: ['open-meteo'] },
    clima_geocodificador: { values: ['open-meteo'] },
    clima_ubicacion_nombre: { max: 180 },
    clima_zona_horaria: { max: 80 }
};

function validateConfigurationValue(key, rawValue) {
    const value = String(rawValue ?? '').trim();
    if (['unidad_area','unidad_recoleccion','unidad_comercial'].includes(key)) {
        if (!value) throw new Error(`${key} es obligatorio.`);
        if (value.length > 30) throw new Error(`${key} no puede superar 30 caracteres.`);
        return value;
    }
    if (key === 'peso_lata_kg') {
        const weight = Number(value);
        if (!Number.isFinite(weight) || weight < 1 || weight > 100) throw new Error('El peso de referencia debe estar entre 1 y 100 kg.');
        return String(Math.round(weight * 100) / 100);
    }
    if (key === 'clima_latitud') {
        if (!value) return '';
        const latitude = Number(value);
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('La latitud climática debe estar entre -90 y 90.');
        return String(Math.round(latitude * 1000000) / 1000000);
    }
    if (key === 'clima_longitud') {
        if (!value) return '';
        const longitude = Number(value);
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('La longitud climática debe estar entre -180 y 180.');
        return String(Math.round(longitude * 1000000) / 1000000);
    }
    if (key === 'clima_cache_ttl_minutos') {
        const ttl = Number(value);
        if (!Number.isInteger(ttl) || ttl < 5 || ttl > 120) throw new Error('La caché climática debe estar entre 5 y 120 minutos.');
        return String(ttl);
    }
    if (['moneda_simbolo','moneda_codigo'].includes(key) && value.length > 10) throw new Error(`${key} no puede superar 10 caracteres.`);
    const rule = reportConfigurationRules[key];
    if (!rule) return value;
    if (rule.required && !value) throw new Error('El nombre de la finca u organización es obligatorio para el membrete.');
    if (rule.max && value.length > rule.max) throw new Error(`${key} no puede superar ${rule.max} caracteres.`);
    if (value && rule.pattern && !rule.pattern.test(value)) throw new Error(rule.message);
    if (rule.values && !rule.values.includes(value)) throw new Error(`${key} contiene un valor no permitido.`);
    return value;
}

function updateConfiguration(values = {}) {
    const generalKeys = ['moneda_simbolo','moneda_codigo','unidad_area','unidad_recoleccion','unidad_comercial','peso_lata_kg','operacion_tipo','cosecha_dias_semana','compra_control_calidad','reporte_logo_predeterminado','clima_latitud','clima_longitud','clima_cache_ttl_minutos'];
    const allowed = Object.entries(values).filter(([key]) => Object.hasOwn(reportConfigurationRules, key) || generalKeys.includes(key));
    if (!allowed.length) throw new Error('No se recibieron campos de configuración permitidos.');
    const normalized = allowed.map(([key, rawValue]) => [key, validateConfigurationValue(key, rawValue)]);
    for (const [key, value] of normalized) {
        const existing = SQL.get('SELECT id FROM configuracion WHERE clave = ?', key);
        if (existing) SQL.run('UPDATE configuracion SET valor = ? WHERE clave = ?', value, key);
        else SQL.run('INSERT INTO configuracion (clave, valor) VALUES (?, ?)', value, key);
    }
    guardarDB();
    return getConfigurationMap();
}

function reportBranding() {
    const config = getConfigurationMap();
    const finca = SQL.get('SELECT nombre, ubicacion FROM finca WHERE activo = 1 LIMIT 1') || {};
    return {
        organization: config.reporte_nombre_organizacion || finca.nombre || 'Mi Finca Cafetalera',
        identification: config.reporte_identificacion || '',
        address: config.reporte_direccion || finca.ubicacion || 'Honduras',
        phone: config.reporte_telefono || '',
        email: config.reporte_email || '',
        website: config.reporte_sitio_web || '',
        responsible: config.reporte_responsable || '',
        logoPath: config.reporte_logo_path || '',
        primary: /^#[0-9a-f]{6}$/i.test(config.reporte_color_primario || '') ? config.reporte_color_primario : '#17382C',
        secondary: /^#[0-9a-f]{6}$/i.test(config.reporte_color_secundario || '') ? config.reporte_color_secundario : '#D7A946',
        footer: config.reporte_pie || 'Documento generado localmente por Cafetal OS.',
        showLogo: config.reporte_mostrar_logo !== '0'
    };
}

function decodeReportText(input = '') {
    return String(input)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/\s*(p|div|h[1-6]|tr|section)>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter((line, index, array) => line || (index > 0 && array[index - 1]))
        .join('\n');
}

function resolveReportLogo(branding) {
    const candidates = [branding.logoPath, resourcePath('build', 'icon.png')].filter(Boolean);
    return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

function drawReportHeader(doc, branding, title, pageNumber) {
    doc.save();
    doc.rect(0, 0, doc.page.width, 9).fill(branding.primary);
    const logo = branding.showLogo ? resolveReportLogo(branding) : null;
    let textX = 50;
    if (logo) {
        try {
            doc.image(logo, 50, 29, { fit: [54, 54], align: 'center', valign: 'center' });
            textX = 118;
        } catch (error) {
            console.warn('No se pudo insertar el logo en el PDF:', error.message);
        }
    }
    doc.fillColor(branding.primary).font('Helvetica-Bold').fontSize(14).text(branding.organization, textX, 30, { width: 300 });
    const identity = [branding.identification, branding.address].filter(Boolean).join(' · ');
    if (identity) doc.fillColor('#4F5D57').font('Helvetica').fontSize(8.5).text(identity, textX, 50, { width: 330 });
    const contact = [branding.phone, branding.email, branding.website].filter(Boolean).join('  |  ');
    if (contact) doc.fillColor('#66736D').fontSize(8).text(contact, textX, 64, { width: 380 });
    doc.fillColor(branding.secondary).rect(doc.page.width - 166, 30, 116, 5).fill();
    doc.fillColor('#64716B').fontSize(8).text(`Página ${pageNumber}`, doc.page.width - 166, 44, { width: 116, align: 'right' });
    doc.moveTo(50, 94).lineTo(doc.page.width - 50, 94).lineWidth(1).strokeColor(branding.secondary).stroke();
    doc.fillColor(branding.primary).font('Helvetica-Bold').fontSize(16).text(title, 50, 105, { width: doc.page.width - 100 });
    doc.fillColor('#69756F').font('Helvetica').fontSize(8.5).text(`Emitido ${new Intl.DateTimeFormat('es-HN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}${branding.responsible ? ` · Responsable: ${branding.responsible}` : ''}`, 50, 128, { width: doc.page.width - 100 });
    doc.restore();
}

function drawReportFooter(doc, branding, pageNumber, pageCount) {
    const y = doc.page.height - 48;
    doc.save();
    doc.moveTo(50, y - 9).lineTo(doc.page.width - 50, y - 9).lineWidth(0.5).strokeColor('#D8DDD9').stroke();
    doc.fillColor('#7C8882').font('Helvetica').fontSize(7.5).text(branding.footer, 50, y, { width: doc.page.width - 180 });
    doc.fillColor(branding.primary).font('Helvetica-Bold').text(`Cafetal OS · ${pageNumber}/${pageCount}`, doc.page.width - 150, y, { width: 100, align: 'right' });
    doc.restore();
}

function writeReportBody(doc, rawContent, branding) {
    const text = decodeReportText(rawContent);
    const lines = text.split('\n');
    for (const line of lines) {
        if (!line) { doc.moveDown(0.45); continue; }
        if (/^-{3,}$/.test(line)) {
            doc.moveDown(0.25).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#D9DEDA').lineWidth(0.6).stroke().moveDown(0.5);
            continue;
        }
        const heading = /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 ()/%.,-]{3,}:?$/.test(line) && line.length < 90;
        if (heading) {
            doc.moveDown(0.55).fillColor(branding.primary).font('Helvetica-Bold').fontSize(10.5).text(line.replace(/:$/, ''), { paragraphGap: 3 });
            continue;
        }
        if (/^[•*-]\s+/.test(line)) {
            doc.fillColor('#2F3935').font('Helvetica').fontSize(9.5).text(`• ${line.replace(/^[•*-]\s+/, '')}`, { indent: 12, paragraphGap: 3, lineGap: 1.5 });
            continue;
        }
        const labelValue = line.match(/^([^:]{2,36}):\s*(.+)$/);
        if (labelValue) {
            doc.fillColor('#2F3935').font('Helvetica-Bold').fontSize(9.5).text(`${labelValue[1]}: `, { continued: true });
            doc.font('Helvetica').text(labelValue[2], { paragraphGap: 3, lineGap: 1.5 });
            continue;
        }
        doc.fillColor('#2F3935').font('Helvetica').fontSize(9.5).text(line, { paragraphGap: 4, lineGap: 1.5 });
    }
}

secureHandle('exportar:pdf', async (event, { titulo, contenidoHtml }) => {
    const PDFDocument = require('pdfkit');
    const safeTitle = String(titulo || 'Reporte Cafetal OS');
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar reporte PDF',
        defaultPath: `${safeTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_')}.pdf`,
        filters: [{ name: 'Documento PDF', extensions: ['pdf'] }]
    });
    if (result.canceled) return null;

    const branding = reportBranding();
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 158, right: 50, bottom: 72, left: 50 }, bufferPages: true, info: { Title: safeTitle, Author: branding.organization, Subject: 'Reporte generado por Cafetal OS', Creator: `Cafetal OS ${app.getVersion()}` } });
    const stream = fs.createWriteStream(result.filePath);
    doc.pipe(stream);
    drawReportHeader(doc, branding, safeTitle, 1);
    writeReportBody(doc, contenidoHtml, branding);

    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index++) {
        doc.switchToPage(index);
        if (index > 0) drawReportHeader(doc, branding, safeTitle, index + 1);
        drawReportFooter(doc, branding, index + 1, range.count);
    }
    doc.end();
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(result.filePath));
        stream.on('error', reject);
    });
});

// Exportar Excel
secureHandle('exportar:excel', async (event, { titulo, columnas, datos }) => {
    const ExcelJS = require('exceljs');
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar Excel',
        defaultPath: `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
        filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });
    if (result.canceled) return null;
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(titulo);
    
    sheet.columns = columnas.map(c => ({ header: c.label || c, key: c.key || c, width: 15 }));
    
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3E2723' } };
    headerRow.alignment = { horizontal: 'center' };
    
    datos.forEach(d => sheet.addRow(d));
    
    sheet.eachRow(row => {
        row.eachCell(cell => {
            cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
        });
    });
    
    await workbook.xlsx.writeFile(result.filePath);
    return result.filePath;
});

// ★ FLUJO 5: Calculadora de Rentabilidad
secureHandle('dashboard:getRentabilidad', (event, año) => {
    const anio = año || new Date().getFullYear();
    // Ingresos por ventas de inventario
    const ingresos = SQL.get(`SELECT COALESCE(SUM(total_venta), 0) as total_ventas
        FROM inventario WHERE tipo_movimiento = 'venta'
        AND strftime('%Y', fecha_movimiento) = ?`, String(anio));
    // Costos: gastos de producción
    const costosGastos = (SQL.get(`SELECT COALESCE(SUM(costo_total), 0) as t FROM gastos
        WHERE strftime('%Y', fecha) = ?`, String(anio)) || {}).t || 0;
    // Costos: pago a recolectores
    const costosCosecha = (SQL.get(`SELECT COALESCE(SUM(total_pagado), 0) as t FROM recoleccion
        WHERE strftime('%Y', fecha) = ?`, String(anio)) || {}).t || 0;
    const totalIngresos = ingresos ? ingresos.total_ventas : 0;
    const totalCostos = costosGastos + costosCosecha;
    const utilidad = totalIngresos - totalCostos;
    const rentabilidad = totalCostos > 0 ? (utilidad / totalCostos) * 100 : 0;

    return {
        año: parseInt(anio),
        total_ingresos: totalIngresos,
        costos_gastos: costosGastos,
        costos_cosecha: costosCosecha,
        costos_totales: totalCostos,
        utilidad: utilidad,
        rentabilidad_porcentaje: Math.round(rentabilidad * 100) / 100
    };
});

// ─── SOSTENIBILIDAD ────────────────────────────────────────────────

// Huella de carbono
secureHandle('huella:getAll', (event, lote_id) => {
    if (lote_id) return SQL.query('SELECT h.*, l.codigo as lote_codigo FROM huella_carbono h LEFT JOIN lotes l ON h.lote_id = l.id WHERE h.lote_id = ? ORDER BY h.fecha DESC', lote_id);
    return SQL.query('SELECT h.*, l.codigo as lote_codigo FROM huella_carbono h LEFT JOIN lotes l ON h.lote_id = l.id ORDER BY h.fecha DESC LIMIT 100');
});

secureHandle('huella:create', (event, data) => {
    data = validateEntity('huella', data);
    if (data.lote_id) assertActiveLote(data.lote_id);
    // Calcular CO2e basado en tipo de emisión
    const factores = { fertilizante: 4.5, combustible: 3.2, energia: 0.5, transporte: 0.8, otros: 1.0 };
    data.co2e_kg = Math.round((data.cantidad_kg * (factores[data.tipo_emision] || 1.0)) * 100) / 100;
    const result = SQL.insertObj('huella_carbono', data);
    guardarDB();
    return result;
});

secureHandle('huella:getTotal', () => SQL.get(`SELECT COALESCE(SUM(co2e_kg),0) as total_co2e, COUNT(*) as registros FROM huella_carbono`));

secureHandle('huella:getTorta', () => SQL.query(`SELECT tipo_emision, SUM(co2e_kg) as total FROM huella_carbono GROUP BY tipo_emision`));

// Prácticas regenerativas
secureHandle('practicas:getAll', () => SQL.query('SELECT p.*, l.codigo as lote_codigo FROM practicas_regenerativas p LEFT JOIN lotes l ON p.lote_id = l.id WHERE p.activo = 1 ORDER BY p.fecha_inicio DESC'));

secureHandle('practicas:create', (event, data) => {
    data = validateEntity('practica', data);
    if (data.lote_id) {
        const lote = assertActiveLote(data.lote_id);
        if (data.area_mz && data.area_mz > Number(lote.area_mz) + 0.001) throw new Error(`El área de la práctica no puede superar el área del lote ${lote.codigo}.`);
    }
    const result = SQL.insertObj('practicas_regenerativas', data);
    guardarDB();
    return result;
});

secureHandle('practicas:delete', (event, id) => { SQL.run('UPDATE practicas_regenerativas SET activo = 0 WHERE id = ?', id); guardarDB(); return { changes: 1 }; });

// Certificaciones
secureHandle('certificaciones:getAll', () => SQL.query('SELECT * FROM certificaciones WHERE activo = 1'));

secureHandle('certificaciones:create', (event, data) => { data = validateEntity('certificacion', data); data.finca_id = data.finca_id || 1; const r = SQL.insertObj('certificaciones', data); guardarDB(); return r; });

secureHandle('certificaciones:delete', (event, id) => { SQL.run('UPDATE certificaciones SET activo = 0 WHERE id = ?', id); guardarDB(); return { changes: 1 }; });

// ─── CALIDAD / EVALUACIONES ─────────────────────────────────────────

secureHandle('calidad:getAll', () => SQL.query(`SELECT c.*, l.codigo as lote_codigo, b.lote_id FROM calidad_evaluaciones c LEFT JOIN beneficio b ON c.beneficio_id = b.id LEFT JOIN lotes l ON c.lote_id = l.id ORDER BY c.fecha DESC LIMIT 50`));

secureHandle('calidad:create', (event, data) => {
    data = validateEntity('calidad', data);
    assertActiveLote(data.lote_id);
    if (data.fragancia && data.sabor && data.acidez && data.cuerpo) {
        data.puntaje_sca = Math.round((data.fragancia + data.sabor + data.acidez + data.cuerpo + (data.uniformidad || 10) + (data.taza_limpia || 10) + (data.dulzor || 10)) * 10) / 10;
    }
    const r = SQL.insertObj('calidad_evaluaciones', data); guardarDB(); return r;
});

// ─── TRAZABILIDAD BLOCKCHAIN ────────────────────────────────────────

secureHandle('trazabilidad:generarHash', (event, { tipo_registro, registro_id, datos_resumen }) => {
    const timestamp = new Date().toISOString();
    const lastBlock = SQL.get('SELECT hash_bloque FROM bloques_trazabilidad ORDER BY id DESC LIMIT 1');
    const hashAnterior = lastBlock ? lastBlock.hash_bloque : 'GENESIS';
    const rawData = `${tipo_registro}:${registro_id}:${timestamp}:${hashAnterior}:${JSON.stringify(datos_resumen || {})}`;
    const hash = crypto.createHash('sha256').update(rawData).digest('hex');
    SQL.insertObj('bloques_trazabilidad', {
        hash_bloque: hash, hash_anterior: hashAnterior, tipo_registro: tipo_registro,
        registro_id: registro_id, timestamp: timestamp, datos_resumen: JSON.stringify(datos_resumen || {})
    });
    guardarDB();
    return { hash, hash_anterior: hashAnterior, timestamp };
});

secureHandle('trazabilidad:getCadena', () => SQL.query('SELECT * FROM bloques_trazabilidad ORDER BY id DESC LIMIT 200'));

secureHandle('trazabilidad:verificar', () => {
    const bloques = SQL.query('SELECT * FROM bloques_trazabilidad ORDER BY id ASC');
    let valido = true; let errores = [];
    for (let i = 0; i < bloques.length; i++) {
        const block = bloques[i];
        if (i === 0) {
            if (block.hash_anterior !== 'GENESIS') { valido = false; errores.push(`Bloque ${i}: hash_anterior debe ser GENESIS`); }
        } else {
            const prev = bloques[i - 1];
            if (block.hash_anterior !== prev.hash_bloque) { valido = false; errores.push(`Bloque ${i}: hash_anterior no coincide con bloque ${i-1}`); }
        }
    }
    return { valido, total_bloques: bloques.length, errores };
});

secureHandle('trazabilidad:getByLote', (event, lote_id) => SQL.query(`SELECT * FROM lotes_origen WHERE lote_id = ?`, lote_id));

secureHandle('trazabilidad:crearCodigo', (event, data) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = 'HND-';
    for (let i = 0; i < 8; i++) codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    const existing = SQL.get('SELECT id FROM lotes_origen WHERE lote_id = ?', data.lote_id);
    if (existing) return SQL.get('SELECT * FROM lotes_origen WHERE id = ?', existing.id);
    data.codigo_trazabilidad = codigo;
    const r = SQL.insertObj('lotes_origen', data); guardarDB();
    return SQL.get('SELECT * FROM lotes_origen WHERE id = ?', r.lastInsertRowid);
});

secureHandle('trazabilidad:getRutaCompleta', (event, lote_id) => {
    const lote = SQL.get('SELECT * FROM lotes_origen WHERE lote_id = ?', lote_id);
    if (!lote) return null;
    const bloques = SQL.query(`SELECT * FROM bloques_trazabilidad WHERE 
        (tipo_registro = 'finca' AND registro_id = ?) OR
        (tipo_registro = 'lote' AND registro_id = ?) OR
        (tipo_registro = 'cosecha' AND registro_id IN (SELECT id FROM recoleccion WHERE lote_id = ?)) OR
        (tipo_registro = 'beneficio' AND registro_id IN (SELECT id FROM beneficio WHERE lote_id = ?)) OR
        (tipo_registro = 'inventario' AND registro_id IN (SELECT id FROM inventario WHERE lote_id = ?))
        ORDER BY timestamp ASC`, lote_id, lote_id, lote_id, lote_id, lote_id);
    return { lote, bloques };
});

// ─── QR CODE ────────────────────────────────────────────────────────
secureHandle('trazabilidad:generarQR', async (event, data) => {
    try {
        // data: { texto, lote_id, tipo_registro, registro_id }
        const texto = data.texto || `${data.tipo_registro || 'trazabilidad'}:${data.registro_id || data.lote_id || ''}`;
        const qrDataURL = await QRCode.toDataURL(texto, {
            width: 300, margin: 2, color: { dark: '#3E2723', light: '#FFF8E1' }
        });
        return { qr: qrDataURL, texto };
    } catch (err) {
        return { error: err.message };
    }
});

// ─── MERCADO ────────────────────────────────────────────────────────

secureHandle('mercado:getPreciosRecientes', () => SQL.query('SELECT * FROM precios_historicos ORDER BY fecha DESC LIMIT 30'));

secureHandle('mercado:getUltimoPrecio', (event, tipo_cafe) => SQL.get('SELECT * FROM precios_historicos WHERE tipo_cafe = ? ORDER BY fecha DESC LIMIT 1', tipo_cafe || 'arabica'));

secureHandle('mercado:getBenchmarks', (event, año) => SQL.query('SELECT * FROM benchmarks WHERE año = ?', año || new Date().getFullYear()));

secureHandle('mercado:insertarPrecio', (event, data) => {
    data = validateEntity('precio_mercado', data);
    // convertir USD/kg a HNL/qq: 1 qq = 46 kg, tipo_cambio ~26 HNL/USD
    const tc = 26;
    data.precio_hnl_qq = Math.round(data.precio_usd_kg * 46 * tc * 100) / 100;
    const r = SQL.insertObj('precios_historicos', data); guardarDB(); return r;
});

// ─── MARKETING ──────────────────────────────────────────────────────

secureHandle('marketing:getClientes', () => SQL.query('SELECT * FROM clientes_marketing WHERE activo = 1 ORDER BY nombre'));

secureHandle('marketing:crearCliente', (event, data) => { data = validateEntity('marketing_cliente', data); const r = SQL.insertObj('clientes_marketing', data); guardarDB(); return r; });

secureHandle('marketing:actualizarCliente', (event, id, data) => { data = validateEntity('marketing_cliente', data); SQL.update('clientes_marketing', data, id); guardarDB(); return { changes: 1 }; });

secureHandle('marketing:getCampañas', () => SQL.query('SELECT * FROM campanas_marketing ORDER BY fecha_inicio DESC'));

secureHandle('marketing:crearCampaña', (event, data) => { data = validateEntity('campana', data); const r = SQL.insertObj('campanas_marketing', data); guardarDB(); return r; });

secureHandle('marketing:getPuntosLealtad', () => SQL.query(`SELECT lp.*, cm.nombre as cliente_nombre FROM lealtad_puntos lp JOIN clientes_marketing cm ON lp.cliente_id = cm.id ORDER BY lp.created_at DESC LIMIT 100`));

secureHandle('marketing:agregarPuntos', (event, data) => { data = validateEntity('lealtad', data); if (!SQL.get('SELECT id FROM clientes_marketing WHERE id = ? AND activo = 1', data.cliente_id)) throw new Error('El cliente seleccionado no existe o está inactivo.'); const r = SQL.insertObj('lealtad_puntos', data); guardarDB(); return r; });

// ─── CLIMA ─────────────────────────────────────────────────────────

secureHandle('clima:getRegistros', (event, dias) => {
    const d = new Date(); d.setDate(d.getDate() - (dias || 30));
    return SQL.query('SELECT * FROM registros_clima WHERE fecha >= ? ORDER BY fecha DESC, id DESC', d.toISOString().split('T')[0]);
});

secureHandle('clima:crearRegistro', (event, data) => { data = validateEntity('clima', data); const r = SQL.insertObj('registros_clima', data); guardarDB(); return r; });

secureHandle('clima:getLocation', () => getClimateLocationConfig());

secureHandle('clima:setLocation', (event, data = {}) => {
    const config = updateConfiguration({
        clima_latitud: data.latitude == null ? '' : data.latitude,
        clima_longitud: data.longitude == null ? '' : data.longitude,
        clima_ubicacion_nombre: data.locationName || '',
        clima_zona_horaria: data.timezone || 'auto',
        clima_proveedor: 'open-meteo',
        clima_geocodificador: 'open-meteo'
    });
    initializeWeatherService();
    return { ...getClimateLocationConfig(), config };
});

secureHandle('clima:searchLocations', async (event, query) => {
    if (!weatherService) initializeWeatherService();
    return weatherService.searchLocations(query, 8);
});

secureHandle('clima:getCurrent', async (event, options = {}) => {
    if (!weatherService) initializeWeatherService();
    const saved = getClimateLocationConfig();
    const latitude = options.latitude ?? saved.latitude;
    const longitude = options.longitude ?? saved.longitude;
    if (latitude == null || longitude == null) throw new Error('Configure una ubicación, use la geolocalización del dispositivo o realice una búsqueda manual.');
    const result = await weatherService.getCurrent({
        latitude,
        longitude,
        locationName: String(options.locationName || saved.locationName || '').trim(),
        forecastDays: options.forecastDays || 7,
        force: Boolean(options.force)
    });
    if (options.persist !== false) persistWeatherSnapshot(result);
    return result;
});

secureHandle('clima:getProviderStatus', () => ({
    provider: 'Open-Meteo',
    geocoder: 'Open-Meteo Geocoding',
    online: net.isOnline(),
    cacheTtlMinutes: getClimateLocationConfig().ttlMinutes,
    privacy: 'Las coordenadas se procesan en el equipo y se envían únicamente al proveedor meteorológico durante la consulta.'
}));

secureHandle('clima:getAlertas', () => SQL.query('SELECT a.*, l.codigo as lote_codigo FROM alertas_fitosanitarias a LEFT JOIN lotes l ON a.lote_id = l.id WHERE a.activa = 1 ORDER BY a.nivel DESC, a.fecha_inicio DESC'));

secureHandle('clima:crearAlerta', (event, data) => { data = validateEntity('alerta', data); if (data.lote_id) assertActiveLote(data.lote_id); const r = SQL.insertObj('alertas_fitosanitarias', data); guardarDB(); return r; });

secureHandle('clima:resolverAlerta', (event, id) => { SQL.run("UPDATE alertas_fitosanitarias SET activa = 0, fecha_fin = date('now') WHERE id = ?", id); guardarDB(); return { changes: 1 }; });

// ─── SUSCRIPCIÓN / PERFILES DE SABOR ───────────────────────────────

secureHandle('suscripcion:getPerfiles', () => SQL.query(`SELECT ps.*, v.nombre as variedad_nombre FROM perfiles_sabor ps JOIN variedades v ON ps.variedad_id = v.id`));

secureHandle('suscripcion:crearPerfil', (event, data) => { const r = SQL.insertObj('perfiles_sabor', data); guardarDB(); return r; });

secureHandle('suscripcion:recomendar', (event, cliente_id) => {
    const cliente = SQL.get('SELECT * FROM clientes_marketing WHERE id = ?', cliente_id);
    if (!cliente) return [];
    const perfil = cliente.preferencia_sabor;
    // Buscar lotes que por variedad y altitud coincidan con el perfil
    const recomendaciones = SQL.query(`SELECT l.*, v.nombre as variedad_nombre, ps.perfil_principal, ps.nota_cata, ps.intensidad
        FROM lotes l JOIN variedades v ON l.variedad_id = v.id
        JOIN perfiles_sabor ps ON ps.variedad_id = v.id
        WHERE l.activo = 1 AND ps.perfil_principal = ?
        AND (l.altitud_lote_msnm BETWEEN ps.altitud_min AND ps.altitud_max OR ps.altitud_min IS NULL)
        ORDER BY RANDOM() LIMIT 3`, perfil);
    return recomendaciones.length > 0 ? recomendaciones : SQL.query(`SELECT l.*, v.nombre as variedad_nombre, ps.perfil_principal, ps.nota_cata, ps.intensidad
        FROM lotes l JOIN variedades v ON l.variedad_id = v.id
        JOIN perfiles_sabor ps ON ps.variedad_id = v.id
        WHERE l.activo = 1 ORDER BY RANDOM() LIMIT 3`);
});

secureHandle('suscripcion:guardarFeedback', (event, data) => { const r = SQL.insertObj('recomendaciones_cliente', data); guardarDB(); return r; });

secureHandle('suscripcion:getRecomendaciones', (event, cliente_id) => SQL.query('SELECT rc.*, l.codigo as lote_codigo FROM recomendaciones_cliente rc LEFT JOIN lotes l ON rc.lote_id = l.id WHERE rc.cliente_id = ? ORDER BY rc.created_at DESC', cliente_id));

// ─── EDUCACIÓN ──────────────────────────────────────────────────────

secureHandle('educacion:getArticulos', (event, categoria) => {
    if (categoria) return SQL.query('SELECT * FROM articulos WHERE categoria = ? AND activo = 1 ORDER BY created_at DESC', categoria);
    return SQL.query('SELECT * FROM articulos WHERE activo = 1 ORDER BY created_at DESC');
});

secureHandle('educacion:getArticulo', (event, id) => SQL.get('SELECT * FROM articulos WHERE id = ?', id));

secureHandle('educacion:getTip', (event, modulo, accion) => SQL.get('SELECT * FROM tips_contextuales WHERE modulo = ? AND accion = ? AND activo = 1 ORDER BY RANDOM() LIMIT 1', modulo, accion));

secureHandle('educacion:getProgress', (event) => {
    const session = requireSession(event);
    return SQL.query(`SELECT p.*, a.titulo, a.categoria FROM progreso_educacion p
        JOIN articulos a ON a.id = p.articulo_id WHERE p.usuario_id = ? ORDER BY p.ultima_lectura DESC`, session.id);
});
secureHandle('educacion:saveProgress', (event, data = {}) => {
    const session = requireSession(event);
    const articleId = Number(data.articulo_id);
    if (!SQL.get('SELECT id FROM articulos WHERE id = ? AND activo = 1', articleId)) throw new Error('El artículo educativo no existe.');
    const progress = Math.min(100, Math.max(0, Number(data.progreso_porcentaje || 0)));
    const status = progress >= 100 || data.estado === 'completado' ? 'completado' : 'iniciado';
    const existing = SQL.get('SELECT id FROM progreso_educacion WHERE usuario_id = ? AND articulo_id = ?', session.id, articleId);
    const values = { usuario_id: session.id, articulo_id: articleId, estado: status, progreso_porcentaje: progress, ultima_lectura: new Date().toISOString() };
    if (existing) SQL.update('progreso_educacion', values, existing.id); else SQL.insertObj('progreso_educacion', values);
    guardarDB(); return values;
});
secureHandle('educacion:saveQuiz', (event, data = {}) => {
    const session = requireSession(event);
    const score = Math.max(0, Number(data.puntaje || 0));
    const total = Math.max(1, Number(data.total || 1));
    const result = SQL.insertObj('evaluaciones_educacion', {
        usuario_id: session.id, articulo_id: data.articulo_id || null, puntaje: score, total,
        respuestas: JSON.stringify(data.respuestas || {})
    });
    guardarDB(); return result;
});

// ─── AUTENTICACIÓN Y USUARIOS ─────────────────────────────────────
secureHandle('auth:login', (event, credentials) => {
    const user = authStore.authenticate(credentials?.username, credentials?.password);
    if (!user) throw new Error('Usuario o contraseña incorrectos.');
    authenticatedWindows.set(event.sender.id, user);
    return user;
});

secureHandle('auth:getCurrent', (event) => getSession(event));

secureHandle('auth:logout', (event) => {
    authenticatedWindows.delete(event.sender.id);
    return true;
});

secureHandle('auth:listUsers', () => authStore.list());

secureHandle('auth:createUser', (event, data) => {
    const actor = requireSession(event);
    if (actor.rol !== 'admin') throw new Error('Solo un administrador puede crear usuarios.');
    return authStore.create(data || {});
});

secureHandle('auth:updateUser', (event, id, changes) => {
    const actor = requireSession(event);
    const updated = authStore.update(actor, id, changes || {});
    if (Number(actor.id) === Number(updated.id)) authenticatedWindows.set(event.sender.id, updated);
    return updated;
});

secureHandle('auth:changePassword', (event, data) => {
    const actor = requireSession(event);
    authStore.changePassword(actor, data?.userId || actor.id, data?.currentPassword || '', data?.newPassword || '');
    return true;
});

// ─── CONFIGURACIÓN GENERAL Y MEMBRETE ─────────────────────────────
secureHandle('config:getAll', () => getConfigurationMap());

secureHandle('config:update', (event, values) => {
    const actor = requireSession(event);
    if (actor.rol !== 'admin') throw new Error('Solo un administrador puede modificar la configuración institucional.');
    return updateConfiguration(values || {});
});

secureHandle('config:selectReportLogo', async (event) => {
    const actor = requireSession(event);
    if (actor.rol !== 'admin') throw new Error('Solo un administrador puede cambiar el logotipo.');
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Seleccionar logotipo para los reportes',
        properties: ['openFile'],
        filters: [{ name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg'] }]
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const source = result.filePaths[0];
    const extension = path.extname(source).toLowerCase();
    const assetsDirectory = path.join(app.getPath('userData'), 'report-assets');
    fs.mkdirSync(assetsDirectory, { recursive: true });
    const destination = path.join(assetsDirectory, `report-logo${extension}`);
    fs.copyFileSync(source, destination);
    updateConfiguration({ reporte_logo_path: destination, reporte_mostrar_logo: '1' });
    return { path: destination };
});

secureHandle('config:clearReportLogo', (event) => {
    const actor = requireSession(event);
    if (actor.rol !== 'admin') throw new Error('Solo un administrador puede cambiar el logotipo.');
    return updateConfiguration({ reporte_logo_path: '' });
});

secureHandle('mcp:getInfo', () => {
    const sourceArgs = app.isPackaged ? ['--mcp'] : [app.getAppPath(), '--mcp'];
    return {
        enabled: true,
        transport: 'stdio',
        command: process.execPath,
        args: sourceArgs,
        demoArgs: [...sourceArgs, '--demo'],
        writeArgs: [...sourceArgs, '--write'],
        databasePath: dbPathActual,
        readOnlyByDefault: true
    };
});

// ─── CONFIGURACIÓN DE DATOS ────────────────────────────────────────
secureHandle('db:switchMode', async (event, options = {}) => {
    const actor = requireSession(event);
    if (actor.rol !== 'admin') throw new Error('Solo un administrador puede cambiar la base de datos.');
    return switchDatabaseMode(options.mode, Boolean(options.reset));
});

secureHandle('db:getStatus', () => ({
    mode: getRuntimeMode(),
    databasePath: dbPathActual,
    productionPath: getDatabaseDestination('production'),
    demoPath: getDatabaseDestination('demo')
}));

// Backup manual
secureHandle('db:backup', () => { hacerBackup(); return true; });

secureHandle('app:getInfo', () => ({ version: app.getVersion(), mode: getRuntimeMode(), databasePath: dbPathActual, userDataPath: app.getPath('userData') }));
secureHandle('app:openDocs', (event, doc = 'README.md') => shell.openPath(resourcePath(doc)));

// ─── App lifecycle ────────────────────────────────────────────────
const mcpMode = hasFlag('--mcp');

app.whenReady().then(async () => {
    if (mcpMode) {
        await startMcpServer({ app, resourcePath, argv: process.argv });
        return;
    }
    authStore = new AuthStore(path.join(app.getPath('userData'), 'security', 'users.json'));
    await initDatabase({ mode: getRuntimeMode(), reset: hasFlag('--reset-demo') && getRuntimeMode() === 'demo' });
    initializeWeatherService();
    configureRendererPermissions();
    createWindow();
}).catch(error => {
    console.error('[Cafetal OS] Error fatal durante el inicio:', error);
    if (!mcpMode) dialog.showErrorBox('Cafetal OS no pudo iniciar', `${error.message}\n\nRevise la consola para obtener más detalles.`);
    app.exit(1);
});

app.on('window-all-closed', () => {
    if (mcpMode) return;
    guardarDB();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (mcpMode) return;
    guardarDB();
    if (db) { db.close(); db = null; }
});

app.on('activate', () => {
    if (!mcpMode && mainWindow === null) createWindow();
});
