const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
app.setName('Cafetal OS');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
import { AuthStore } from './auth-store.js';

let mainWindow;
let db;
let authStore;
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
            backgroundThrottling: false
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
            label: 'Módulos',
            submenu: [
                ['Inicio', 'inicio'], ['Mi finca', 'finca'], ['Lotes', 'lotes'], ['Cosecha', 'cosecha'],
                ['Beneficio', 'beneficio'], ['Inventario', 'inventario'], ['Gastos', 'gastos'],
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

// ─── IPC Handlers ──────────────────────────────────────────────────

// Finca
secureHandle('finca:get', () => SQL.get('SELECT * FROM finca WHERE activo = 1 LIMIT 1'));

secureHandle('finca:update', (event, data) => {
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
    WHERE l.activo = 1 ORDER BY l.codigo`));

secureHandle('lotes:getById', (event, id) => SQL.get(`SELECT l.*, v.nombre as variedad_nombre 
    FROM lotes l LEFT JOIN variedades v ON l.variedad_id = v.id WHERE l.id = ?`, id));

secureHandle('lotes:create', (event, data) => {
    const result = SQL.insertObj('lotes', data);
    guardarDB();
    return result;
});

secureHandle('lotes:update', (event, id, data) => {
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
    FROM lotes WHERE activo = 1`));

// Recolectores
secureHandle('recolectores:getAll', () => SQL.query('SELECT * FROM recolectores WHERE activo = 1 ORDER BY nombre_completo'));

secureHandle('recolectores:create', (event, data) => {
    const result = SQL.insertObj('recolectores', data);
    guardarDB();
    return result;
});

// Cosecha
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
    data.cantidad_kg = data.cantidad_qq * 46;
    if ((data.tipo_movimiento === 'venta') && data.precio_venta_qq) {
        data.total_venta = data.cantidad_qq * data.precio_venta_qq;
    }
    const result = SQL.insertObj('inventario', data);
    guardarDB();
    return result;
});

secureHandle('inventario:delete', (event, id) => {
    SQL.run('DELETE FROM inventario WHERE id = ?', id);
    guardarDB();
    return { changes: 1 };
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

// Dashboard
secureHandle('dashboard:getStats', () => {
    const totalLotes = (SQL.get('SELECT COUNT(*) as c FROM lotes WHERE activo=1') || {}).c || 0;
    const areaTotal = (SQL.get('SELECT COALESCE(SUM(area_mz),0) as t FROM lotes WHERE activo=1') || {}).t || 0;
    const cosechaMes = SQL.get(`SELECT COALESCE(SUM(latas_recolectadas),0) as latas, 
        COALESCE(SUM(kilos_estimados),0) as kilos FROM recoleccion 
        WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')`) || { latas: 0, kilos: 0 };
    const gastosAnio = (SQL.get(`SELECT COALESCE(SUM(costo_total),0) as t FROM gastos 
        WHERE strftime('%Y', fecha) = strftime('%Y', 'now')`) || {}).t || 0;
    const inventarioTotal = (SQL.get(`SELECT COALESCE(SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad_qq ELSE -cantidad_qq END),0) as t
        FROM inventario`) || {}).t || 0;
    return { totalLotes, areaTotal, cosechaMes: cosechaMes.latas, kilosMes: cosechaMes.kilos, gastosAnio, inventarioTotal };
});

// Exportar PDF
secureHandle('exportar:pdf', async (event, { titulo, contenidoHtml }) => {
    const PDFDocument = require('pdfkit');
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar PDF',
        defaultPath: `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (result.canceled) return null;
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(result.filePath);
    doc.pipe(stream);
    
    doc.fontSize(20).fillColor('#3E2723').text('☕ Cafetal OS', { align: 'center' });
    doc.fontSize(12).fillColor('#5D4037').text(titulo, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(`Generado: ${new Date().toLocaleDateString('es-HN')}`, { align: 'right' });
    doc.moveDown();
    doc.strokeColor('#A1887F').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    
    doc.fontSize(10).fillColor('#333');
    const lines = contenidoHtml.replace(/<[^>]*>/g, '').split('\n');
    for (const line of lines) {
        if (line.trim()) doc.text(line.trim());
    }
    
    const bottomY = doc.page.height - 50;
    doc.fontSize(8).fillColor('#999').text('Cafetal OS v1.0 — Sistema de Control de Producción Cafetalera', 50, bottomY, { align: 'center' });
    
    doc.end();
    return new Promise((resolve) => { stream.on('finish', () => resolve(result.filePath)); });
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
    const result = SQL.insertObj('practicas_regenerativas', data);
    guardarDB();
    return result;
});

secureHandle('practicas:delete', (event, id) => { SQL.run('UPDATE practicas_regenerativas SET activo = 0 WHERE id = ?', id); guardarDB(); return { changes: 1 }; });

// Certificaciones
secureHandle('certificaciones:getAll', () => SQL.query('SELECT * FROM certificaciones WHERE activo = 1'));

secureHandle('certificaciones:create', (event, data) => { const r = SQL.insertObj('certificaciones', data); guardarDB(); return r; });

secureHandle('certificaciones:delete', (event, id) => { SQL.run('UPDATE certificaciones SET activo = 0 WHERE id = ?', id); guardarDB(); return { changes: 1 }; });

// ─── CALIDAD / EVALUACIONES ─────────────────────────────────────────

secureHandle('calidad:getAll', () => SQL.query(`SELECT c.*, l.codigo as lote_codigo, b.lote_id FROM calidad_evaluaciones c LEFT JOIN beneficio b ON c.beneficio_id = b.id LEFT JOIN lotes l ON c.lote_id = l.id ORDER BY c.fecha DESC LIMIT 50`));

secureHandle('calidad:create', (event, data) => {
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
    // convertir USD/kg a HNL/qq: 1 qq = 46 kg, tipo_cambio ~26 HNL/USD
    const tc = 26;
    data.precio_hnl_qq = Math.round(data.precio_usd_kg * 46 * tc * 100) / 100;
    const r = SQL.insertObj('precios_historicos', data); guardarDB(); return r;
});

// ─── MARKETING ──────────────────────────────────────────────────────

secureHandle('marketing:getClientes', () => SQL.query('SELECT * FROM clientes_marketing WHERE activo = 1 ORDER BY nombre'));

secureHandle('marketing:crearCliente', (event, data) => { const r = SQL.insertObj('clientes_marketing', data); guardarDB(); return r; });

secureHandle('marketing:actualizarCliente', (event, id, data) => { SQL.update('clientes_marketing', data, id); guardarDB(); return { changes: 1 }; });

secureHandle('marketing:getCampañas', () => SQL.query('SELECT * FROM campanas_marketing ORDER BY fecha_inicio DESC'));

secureHandle('marketing:crearCampaña', (event, data) => { const r = SQL.insertObj('campanas_marketing', data); guardarDB(); return r; });

secureHandle('marketing:getPuntosLealtad', () => SQL.query(`SELECT lp.*, cm.nombre as cliente_nombre FROM lealtad_puntos lp JOIN clientes_marketing cm ON lp.cliente_id = cm.id ORDER BY lp.created_at DESC LIMIT 100`));

secureHandle('marketing:agregarPuntos', (event, data) => { const r = SQL.insertObj('lealtad_puntos', data); guardarDB(); return r; });

// ─── CLIMA ─────────────────────────────────────────────────────────

secureHandle('clima:getRegistros', (event, dias) => {
    const d = new Date(); d.setDate(d.getDate() - (dias || 30));
    return SQL.query('SELECT * FROM registros_clima WHERE fecha >= ? ORDER BY fecha DESC', d.toISOString().split('T')[0]);
});

secureHandle('clima:crearRegistro', (event, data) => { const r = SQL.insertObj('registros_clima', data); guardarDB(); return r; });

secureHandle('clima:getAlertas', () => SQL.query('SELECT a.*, l.codigo as lote_codigo FROM alertas_fitosanitarias a LEFT JOIN lotes l ON a.lote_id = l.id WHERE a.activa = 1 ORDER BY a.nivel DESC, a.fecha_inicio DESC'));

secureHandle('clima:crearAlerta', (event, data) => { const r = SQL.insertObj('alertas_fitosanitarias', data); guardarDB(); return r; });

secureHandle('clima:resolverAlerta', (event, id) => { SQL.run('UPDATE alertas_fitosanitarias SET activa = 0, fecha_fin = date(\'now\') WHERE id = ?', id); guardarDB(); return { changes: 1 }; });

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
app.whenReady().then(async () => {
    authStore = new AuthStore(path.join(app.getPath('userData'), 'security', 'users.json'));
    await initDatabase({ mode: getRuntimeMode(), reset: hasFlag('--reset-demo') && getRuntimeMode() === 'demo' });
    createWindow();
}).catch(error => {
    console.error('[Cafetal OS] Error fatal durante el inicio:', error);
    dialog.showErrorBox('Cafetal OS no pudo iniciar', `${error.message}\n\nRevise la consola para obtener más detalles.`);
    app.exit(1);
});

app.on('window-all-closed', () => {
    guardarDB();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    guardarDB();
    if (db) { db.close(); db = null; }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
