#!/usr/bin/env node
/**
 * =============================================================================
 *  generate_demo_data.js — Generador de Datos Sintéticos para Cafetal OS
 * =============================================================================
 *
 *  Simula 5 años de operación de una finca cafetalera hondureña con:
 *  - Lotes de diferentes variedades, edades y áreas
 *  - Cosechas diarias en temporada (octubre–marzo) con recolectores
 *  - Procesamiento en beneficio (pergamino seco)
 *  - Inventario (entradas desde beneficio + ventas)
 *  - Gastos de producción (fertilizantes, mano de obra, etc.)
 *
 *  Uso:
 *    node scripts/generate_demo_data.js
 *    node scripts/generate_demo_data.js --years 3
 *    node scripts/generate_demo_data.js --output database/cafetal-os-demo.db --years 5
 *    node scripts/generate_demo_data.js --clean
 *
 *  Requisitos: sql.js (npm install sql.js)
 * =============================================================================
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ─── Configuración ──────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT = path.join(PROJECT_ROOT, 'database', 'cafetal-os-demo.db');
const SCHEMA_PATH = path.join(PROJECT_ROOT, 'database', 'schema.sql');
const SEEDS_PATH = path.join(PROJECT_ROOT, 'database', 'seeds.sql');
const DEMO_SEEDS_PATH = path.join(PROJECT_ROOT, 'database', 'demo_seeds.sql');
const DEFAULT_YEARS = 5;
const KG_PER_QQ = 46;

// ─── Parámetros de línea de comandos ────────────────────────────────────────
const args = process.argv.slice(2);
const FLAGS = {
    output: DEFAULT_OUTPUT,
    years: DEFAULT_YEARS,
    clean: false
};

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--output':
        case '-o':
            FLAGS.output = path.resolve(PROJECT_ROOT, args[++i]);
            break;
        case '--years':
        case '-y':
            FLAGS.years = parseInt(args[++i], 10) || DEFAULT_YEARS;
            break;
        case '--clean':
        case '-c':
            FLAGS.clean = true;
            break;
        case '--deploy':
        case '-d':
            console.error('La opción --deploy fue retirada para proteger la plantilla productiva. Use: npm run demo:reset');
            process.exit(2);
        case '--help':
        case '-h':
            console.log(`
  Uso: node scripts/generate_demo_data.js [opciones]

  Opciones:
    --output, -o  Ruta del archivo .db de salida
                   (defecto: database/cafetal-os-demo.db)
    --years,  -y  Número de años a simular (defecto: 5)
    --clean,  -c  Elimina la base de datos demo (no genera datos)
    --help,   -h  Muestra esta ayuda
            `);
            process.exit(0);
    }
}

// ─── Modo Clean ─────────────────────────────────────────────────────────────
if (FLAGS.clean) {
    if (fs.existsSync(FLAGS.output)) {
        fs.unlinkSync(FLAGS.output);
        const wal = FLAGS.output + '-wal';
        const shm = FLAGS.output + '-shm';
        if (fs.existsSync(wal)) fs.unlinkSync(wal);
        if (fs.existsSync(shm)) fs.unlinkSync(shm);
        console.log(`✓ Base de datos demo eliminada: ${FLAGS.output}`);
    } else {
        console.log(`ℹ No existe base de datos demo en: ${FLAGS.output}`);
    }
    process.exit(0);
}

// ─── Cargar sql.js ──────────────────────────────────────────────────────────
let initSqlJs;
try {
    initSqlJs = require('sql.js');
} catch (e) {
    console.error('✗ Error: sql.js no está instalado. Ejecute: npm install sql.js');
    process.exit(1);
}

// ─── Helper: Números aleatorios con distribución ────────────────────────────
const random = {
    /** Entero entre min y max (inclusivo) */
    int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    /** Decimal entre min y max */
    float: (min, max, decimals = 2) => {
        const val = Math.random() * (max - min) + min;
        return parseFloat(val.toFixed(decimals));
    },
    /** Elige un elemento aleatorio de un array */
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    /** Elige N elementos sin repetición */
    pickN: (arr, n) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    },
    /** Normal/Gaussiana aproximada (Box-Muller) */
    normal: (mean, stddev) => {
        const u1 = Math.random();
        const u2 = Math.random();
        return mean + stddev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
    /** Fecha aleatoria en rango */
    date: (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        return new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime()));
    },
    /** Fecha como string YYYY-MM-DD */
    dateStr: (start, end) => random.date(start, end).toISOString().split('T')[0],
    /** Peso para estacionalidad: 0=dic-feb (temporada alta), 6=ago (temporada baja) */
    seasonalWeight: (month) => {
        // Pico oct-mar (temporada cosecha café HN)
        const weights = {
            0: 0.25, 1: 0.30, 2: 0.28, 3: 0.22,   // ene-abr (bajando)
            4: 0.10, 5: 0.05, 6: 0.03, 7: 0.04,    // may-ago (mínimo)
            8: 0.06, 9: 0.20, 10: 0.35, 11: 0.30   // sep-dic (subiendo)
        };
        return weights[month] || 0.10;
    }
};

// ─── Datos maestros ficticios ───────────────────────────────────────────────
const FINCA_DEMO = {
    nombre: 'Finca El Sabanero',
    ubicacion: 'Santa Bárbara, Honduras',
    altitud_msnm: 1420,
    area_total_mz: 18.5,
    area_cafe_mz: 14.2,
    certificaciones: 'Café de Altura, Comercio Justo',
    coordenadas: '14.9167° N, 88.2333° O'
};

const LOTES_DEMO = [
    { codigo: 'SB-01', area_mz: 2.5, variedad_id: 3,  anio_siembra: 2014, densidad_plantas_mz: 3200, altitud: 1380, exposicion: 'Este',  tipo_suelo: 'Franco arcilloso', estado: 'produccion' },
    { codigo: 'SB-02', area_mz: 1.8, variedad_id: 4,  anio_siembra: 2016, densidad_plantas_mz: 3000, altitud: 1410, exposicion: 'Norte', tipo_suelo: 'Franco',           estado: 'produccion' },
    { codigo: 'SB-03', area_mz: 2.0, variedad_id: 1,  anio_siembra: 2013, densidad_plantas_mz: 3500, altitud: 1360, exposicion: 'Sur',   tipo_suelo: 'Franco arenoso',    estado: 'produccion' },
    { codigo: 'SB-04', area_mz: 1.5, variedad_id: 6,  anio_siembra: 2018, densidad_plantas_mz: 2800, altitud: 1440, exposicion: 'Oeste', tipo_suelo: 'Arcilloso',         estado: 'produccion' },
    { codigo: 'SB-05', area_mz: 2.2, variedad_id: 10, anio_siembra: 2019, densidad_plantas_mz: 2500, altitud: 1480, exposicion: 'Este',  tipo_suelo: 'Franco limoso',     estado: 'produccion' },
    { codigo: 'SB-06', area_mz: 1.2, variedad_id: 2,  anio_siembra: 2020, densidad_plantas_mz: 3300, altitud: 1400, exposicion: 'Norte', tipo_suelo: 'Franco arcilloso',  estado: 'produccion' },
    { codigo: 'SB-07', area_mz: 1.8, variedad_id: 5,  anio_siembra: 2012, densidad_plantas_mz: 2600, altitud: 1430, exposicion: 'Sur',   tipo_suelo: 'Franco',           estado: 'reposicion' },
    { codigo: 'SB-08', area_mz: 1.2, variedad_id: 8,  anio_siembra: 2021, densidad_plantas_mz: 2900, altitud: 1450, exposicion: 'Oeste', tipo_suelo: 'Franco arenoso',    estado: 'produccion' }
];

// Mapeo de nombres de campo del objeto a nombres reales de columna en DB
const MAP_LOTE_DB = {
    codigo: 'codigo',
    area_mz: 'area_mz',
    variedad_id: 'variedad_id',
    anio_siembra: 'año_siembra',
    densidad_plantas_mz: 'densidad_plantas_mz',
    altitud: 'altitud_lote_msnm',
    exposicion: 'exposicion',
    tipo_suelo: 'tipo_suelo',
    estado: 'estado'
};

const RECOLECTORES_DEMO = [
    { nombre: 'Juan Pérez',           id: 'DEMO-1001', tel: '0000-1001' },
    { nombre: 'María López',          id: 'DEMO-1002', tel: '0000-1002' },
    { nombre: 'Pedro García',         id: 'DEMO-1003', tel: '0000-1003' },
    { nombre: 'Ana Hernández',        id: 'DEMO-1004', tel: '0000-1004' },
    { nombre: 'Carlos Martínez',      id: 'DEMO-1005', tel: '0000-1005' },
    { nombre: 'Rosa Torres',          id: 'DEMO-1006', tel: '0000-1006' },
    { nombre: 'José Reyes',           id: 'DEMO-1007', tel: '0000-1007' },
    { nombre: 'Lucía Méndez',         id: 'DEMO-1008', tel: '0000-1008' },
    { nombre: 'Francisco Rivera',     id: 'DEMO-1009', tel: '0000-1009' },
    { nombre: 'Elena Cruz',           id: 'DEMO-1010', tel: '0000-1010' },
    { nombre: 'Miguel Ángel Paz',     id: 'DEMO-1011', tel: '0000-1011' },
    { nombre: 'Sofía Lagos',          id: 'DEMO-1012', tel: '0000-1012' },
    { nombre: 'Roberto Medina',       id: 'DEMO-1013', tel: '0000-1013' },
    { nombre: 'Carmen Flores',        id: 'DEMO-1014', tel: '0000-1014' },
    { nombre: 'Luis Hernández',       id: 'DEMO-1015', tel: '0000-1015' }
];

const CATEGORIAS_GASTO = [
    'fertilizante', 'fungicida', 'herbicida', 'mano_obra',
    'transporte', 'insumos', 'maquinaria', 'mantenimiento',
    'servicios', 'otros'
];

const PROVEEDORES_GASTO = [
    'AgroServicios HB', 'Fertilizantes del Norte', 'Coop. Cafetalera SB',
    'Transportes Hernández', 'Insumos Agrícolas Paz', 'AgroMantenimiento',
    'Servicios Técnicos Ríos', 'Comercial Agrícola HN', null
];

const DESC_GASTO = {
    fertilizante: [
        'Fertilizante 18-46-00 (100 sacos)', 'Urea agrícola (50 sacos)',
        'Fertilizante foliar líquido', 'Abono orgánico compostado',
        'Fertilizante 12-24-12 (80 sacos)', 'Sulfato de amonio'
    ],
    fungicida: [
        'Fungicida cúprico (Oxicloruro)', 'Caldo bordalés (200 L)',
        'Fungicida sistémico para roya', 'Azufre agrícola micronizado',
        'Control antracnosis (aplicación)'
    ],
    herbicida: [
        'Herbicida glifosato (20 L)', 'Herbicida pre-emergente',
        'Control manual de maleza (cuadrilla)', 'Herbicida selectivo'
    ],
    mano_obra: [
        'Jornales para poda (6 peones x 3 días)', 'Jornales para fertilización',
        'Limpia general de lotes (cuadrilla)', 'Jornales para renovación',
        'Mano de obra para chapia', 'Jornales para cosecha (temporal)'
    ],
    transporte: [
        'Flete de insumos (SB-01 a SB-05)', 'Transporte de café a beneficiado',
        'Flete de fertilizante desde Santa Bárbara', 'Transporte de cosecha'
    ],
    insumos: [
        'Malla para secado solar (10 rollos)', 'Cabuya y rafia para amarre',
        'Sacos de yute (50 unidades)', 'Bandejas germinadoras',
        'Estacas para sombra temporal', 'Manguera para riego'
    ],
    maquinaria: [
        'Alquiler de motocultor para preparación', 'Combustible para bomba',
        'Reparación de motosierra', 'Alquiler de despulpadora',
        'Mantenimiento de bomba estacionaria'
    ],
    mantenimiento: [
        'Reparación de cerca perimetral', 'Mantenimiento de cajones de fermentación',
        'Limpieza de canales de drenaje', 'Reparación de camino interno',
        'Mantenimiento de secador solar'
    ],
    servicios: [
        'Asistencia técnica IHCAFE (visita)', 'Análisis de suelo (laboratorio)',
        'Certificación de café orgánico', 'Capacitación en beneficio húmedo',
        'Control de calidad (catación)'
    ],
    otros: [
        'Compra de herramientas menores', 'Útiles de oficina y registro',
        'Gastos varios de administración', 'Refrigerio para trabajadores'
    ]
};

const COMPRADORES = [
    'Exportadora de Café Santa Bárbara', 'Beneficio El Roble',
    'Cooperativa Cafetalera Occidental', 'Comercializadora Café de Altura HN',
    'Café Hondureño para el Mundo S.A.', 'Tostaduría Artesanal Montecristo'
];

// ─── Base de Datos ──────────────────────────────────────────────────────────
let db;

async function initDB() {
    const SQLJS = await initSqlJs();
    db = new SQLJS.Database();
    return db;
}

function ejecutarSQL(sql) {
    db.run(sql);
}

function leerArchivoSQL(filepath) {
    return fs.readFileSync(filepath, 'utf8');
}

function ejecutarScriptSQL(filepath) {
    const sql = leerArchivoSQL(filepath);
    db.run(sql);
}

function insertar(tabla, datos) {
    const cols = Object.keys(datos);
    const vals = Object.values(datos);
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT INTO ${tabla} (${cols.join(', ')}) VALUES (${placeholders})`;
    db.run(sql, vals);
    const stmt = db.prepare('SELECT last_insert_rowid()');
    stmt.step();
    const id = stmt.getAsObject()['last_insert_rowid()'];
    stmt.free();
    return id;
}

function consultarUna(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    let result = null;
    if (stmt.step()) {
        result = stmt.getAsObject();
    }
    stmt.free();
    return result;
}

function consultar(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// ─── Generación de Datos ─────────────────────────────────────────────────────

/**
 * Genera fecha de inicio (5 años atrás desde hoy) y fecha fin (hoy).
 * years: número de años a simular
 */
function getDateRange(years) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - years);
    start.setHours(0, 0, 0, 0);
    return { start, end, startStr: start.toISOString().split('T')[0], endStr: end.toISOString().split('T')[0] };
}

/**
 * Genera N días hábiles dentro del rango usando estacionalidad mensual.
 */
function generarDiasCosecha(start, end, maxPorMes = 20) {
    const days = [];
    const current = new Date(start);

    while (current <= end) {
        const month = current.getMonth();
        const weight = random.seasonalWeight(month);
        // Probabilidad de cosecha basada en estacionalidad
        const prob = weight * 0.85; // max 85% en pico

        if (Math.random() < prob) {
            days.push(new Date(current));
        }

        current.setDate(current.getDate() + 1);
    }

    return days;
}

/**
 * Genera la data completa
 */
async function generarDemo(years) {
    console.log('☕  Cafetal OS — Generador de Datos Demo\n');
    console.log(`📅  Simulando ${years} años de operación...\n`);

    // ── Paso 0: Inicializar DB ──────────────────────────────────────────────
    console.log('📦  Inicializando base de datos...');
    await initDB();

    // ── Paso 1: Schema ──────────────────────────────────────────────────────
    console.log('🏗️  Creando esquema de tablas...');
    ejecutarScriptSQL(SCHEMA_PATH);

    // ── Paso 2: Seeds (variedades, recolectores) ────────────────────────────
    console.log('🌱  Insertando datos semilla...');
    ejecutarScriptSQL(SEEDS_PATH);

    // ── Paso 3: Finca ──────────────────────────────────────────────────────
    console.log('🏠  Creando finca...');
    insertar('finca', FINCA_DEMO);
    ejecutarScriptSQL(DEMO_SEEDS_PATH);
    const reportConfig = {
        reporte_nombre_organizacion: FINCA_DEMO.nombre,
        reporte_identificacion: 'DEMO-HN-CAFE-001',
        reporte_direccion: FINCA_DEMO.ubicacion,
        reporte_telefono: '+504 0000-0000 (DEMO)',
        reporte_email: 'demo@cafetal-os.example',
        reporte_sitio_web: 'cafetal-os.example',
        reporte_responsable: 'Administrador de demostración',
        reporte_pie: 'Documento demostrativo generado localmente por Cafetal OS. Datos ficticios.',
        clima_proveedor: 'open-meteo',
        clima_geocodificador: 'open-meteo',
        clima_cache_ttl_minutos: '30',
        clima_latitud: '14.9167',
        clima_longitud: '-88.2333',
        clima_ubicacion_nombre: 'Santa Bárbara, Honduras',
        clima_zona_horaria: 'America/Tegucigalpa'
    };
    for (const [key, value] of Object.entries(reportConfig)) {
        db.run('UPDATE configuracion SET valor = ? WHERE clave = ?', [value, key]);
    }

    // ── Paso 4: Lotes ──────────────────────────────────────────────────────
    console.log('🌳  Creando lotes...');
    const loteIds = LOTES_DEMO.map(l => {
        // Mapear nombres de campo JS → nombres reales en DB
        const lote = {
            finca_id: 1,
            observaciones: `Lote establecido en ${l.anio_siembra}. Variedad de alta calidad.`,
            activo: 1,
            fecha_registro: `${l.anio_siembra}-06-15`
        };
        for (const [jsKey, dbKey] of Object.entries(MAP_LOTE_DB)) {
            lote[dbKey] = l[jsKey];
        }
        return insertar('lotes', lote);
    });
    console.log(`  → ${loteIds.length} lotes creados`);

    // ── Paso 5: Recolectores adicionales ───────────────────────────────────
    console.log('👥  Registrando recolectores...');
    const recolectorIds = [];
    for (const r of RECOLECTORES_DEMO) {
        const id = insertar('recolectores', {
            nombre_completo: r.nombre,
            identificacion: r.id,
            telefono: r.tel,
            activo: 1
        });
        recolectorIds.push(id);
    }
    console.log(`  → ${recolectorIds.length} recolectores registrados`);

    // ── Paso 6: Fechas del rango ───────────────────────────────────────────
    const range = getDateRange(years);
    console.log(`📆  Rango: ${range.startStr} → ${range.endStr}\n`);

    // ── Paso 7: Recolección (Cosecha) ──────────────────────────────────────
    console.log('🌾  Generando registros de cosecha...');
    const diasCosecha = generarDiasCosecha(range.start, range.end);
    let totalCosechas = 0;
    let totalKilos = 0;
    let totalLatas = 0;
    let totalPagado = 0;

    // Calcular edades de lotes (impacta rendimiento)
    const loteEdad = loteIds.map((id, i) => ({
        dbId: id,
        index: i,
        area: LOTES_DEMO[i].area_mz,
        activo: LOTES_DEMO[i].estado !== 'reposicion',
        variedadBase: LOTES_DEMO[i].variedad_id
    }));

    for (const fecha of diasCosecha) {
        const fechaStr = fecha.toISOString().split('T')[0];
        const month = fecha.getMonth();
        const seasonWeight = random.seasonalWeight(month);

        // Cuántos lotes se cosechan hoy (1-3, dependiendo de temporada)
        const numLotesHoy = seasonWeight > 0.2 ? random.int(1, 3) : random.int(0, 1);
        if (numLotesHoy === 0) continue;

        const lotesHoy = random.pickN(loteEdad.filter(l => l.activo).map(l => l.dbId), Math.min(numLotesHoy, loteIds.length));

        for (const loteId of lotesHoy) {
            // Cuántos recolectores hoy (2-5 en pico, 1-3 en valle)
            const numRec = seasonWeight > 0.2 ? random.int(2, 5) : random.int(1, 3);
            const recHoy = random.pickN(recolectorIds, numRec);

            for (const recId of recHoy) {
                // Latas por recolector (5-22 en pico, 2-8 en valle)
                const latasBase = seasonWeight > 0.2 ? random.float(5, 22) : random.float(2, 8);
                const latas = parseFloat(latasBase.toFixed(1));
                const pesoLata = 18 + random.float(-1, 1.5);
                const kilos = parseFloat((latas * pesoLata).toFixed(1));
                const precioLata = seasonWeight > 0.2 ? random.float(28, 42) : random.float(22, 30);
                const total = parseFloat((latas * precioLata).toFixed(2));

                // Tipo de madurez según temporada
                const madurezOptions = seasonWeight > 0.2
                    ? ['maduro', 'maduro', 'maduro', 'pinton', 'mixto']
                    : ['verde', 'pinton', 'maduro', 'mixto', 'sobremaduro'];
                const tipoMadurez = random.pick(madurezOptions);

                // Hora inicio/fin (5am - 12pm típico)
                const hIni = random.int(5, 7);
                const mIni = random.pick([0, 15, 30, 45]);
                const hFin = hIni + random.int(3, 6);
                const mFin = random.pick([0, 15, 30, 45]);

                insertar('recoleccion', {
                    lote_id: loteId,
                    fecha: fechaStr,
                    recolector_id: recId,
                    latas_recolectadas: latas,
                    kilos_estimados: kilos,
                    peso_lata_kg: parseFloat(pesoLata.toFixed(1)),
                    tipo_madurez: tipoMadurez,
                    precio_por_lata: parseFloat(precioLata.toFixed(2)),
                    total_pagado: total,
                    hora_inicio: `${String(hIni).padStart(2, '0')}:${String(mIni).padStart(2, '0')}`,
                    hora_fin: `${String(hFin).padStart(2, '0')}:${String(mFin).padStart(2, '0')}`,
                    observaciones: ''
                });

                totalCosechas++;
                totalKilos += kilos;
                totalLatas += latas;
                totalPagado += total;
            }
        }
    }
    console.log(`  → ${totalCosechas} registros de cosecha`);
    console.log(`  → ${totalLatas.toFixed(0)} latas recolectadas`);
    console.log(`  → ${totalKilos.toFixed(0)} kilos de café cereza`);
    console.log(`  → L ${totalPagado.toFixed(2)} pagado a recolectores\n`);

    // ── Paso 8: Beneficio ──────────────────────────────────────────────────
    console.log('🔄  Generando procesos de beneficio...');

    // Agrupar cosecha por lote y período (cada 2-4 semanas se procesa un lote)
    const cosechasPorLote = {};
    const rowsCosecha = consultar(
        `SELECT lote_id, fecha, SUM(latas_recolectadas) as total_latas,
                SUM(kilos_estimados) as total_kilos
         FROM recoleccion
         GROUP BY lote_id, strftime('%Y-%m-%d', fecha)
         ORDER BY lote_id, fecha`
    );

    // Cada ~4000 kg de cereza se procesa como un lote de beneficio
    const lotesBeneficio = {};
    for (const row of rowsCosecha) {
        if (!lotesBeneficio[row.lote_id]) {
            lotesBeneficio[row.lote_id] = [];
        }
        const arr = lotesBeneficio[row.lote_id];
        if (arr.length === 0) {
            arr.push({ kilos: row.total_kilos, fechaIni: row.fecha, fechaFin: row.fecha, latas: row.total_latas });
        } else {
            const last = arr[arr.length - 1];
            if (last.kilos < 4000) {
                last.kilos += row.total_kilos;
                last.latas += row.total_latas;
                last.fechaFin = row.fecha;
            } else {
                arr.push({ kilos: row.total_kilos, fechaIni: row.fecha, fechaFin: row.fecha, latas: row.total_latas });
            }
        }
    }

    let totalBeneficios = 0;
    let totalPergamino = 0;

    for (const [loteId, batches] of Object.entries(lotesBeneficio)) {
        for (const batch of batches) {
            // Rendimiento: 18-23% de pergamino seco vs cereza
            const rendimiento = random.float(0.18, 0.23);
            const kilosPergamino = parseFloat((batch.kilos * rendimiento).toFixed(1));
            // Horas de fermentación según método
            const metodo = random.pick(['lavado', 'lavado', 'lavado', 'honey', 'natural']);
            const horasFermentacion = metodo === 'lavado' ? random.float(18, 36) :
                metodo === 'honey' ? random.float(12, 24) : random.float(0, 6);
            // Tipo de secado
            const tipoSecado = random.pick(['sol', 'sol', 'sol', 'mecanico', 'combinado']);
            const diasSecado = tipoSecado === 'sol' ? random.int(8, 15) :
                tipoSecado === 'mecanico' ? random.int(2, 4) : random.int(5, 10);

            insertar('beneficio', {
                lote_id: parseInt(loteId),
                fecha_inicio: batch.fechaIni,
                fecha_fin: batch.fechaFin,
                kilos_cereza_ingresados: parseFloat(batch.kilos.toFixed(1)),
                metodo: metodo,
                horas_fermentacion: parseFloat(horasFermentacion.toFixed(1)),
                tipo_secado: tipoSecado,
                dias_secado: diasSecado,
                humedad_final_porcentaje: parseFloat(random.float(10.5, 12.0).toFixed(1)),
                kilos_pergamino_seco: kilosPergamino,
                rendimiento_porcentaje: parseFloat((rendimiento * 100).toFixed(1)),
                observaciones: `Lote procesado vía ${metodo}. Secado al ${tipoSecado}.`
            });

            totalBeneficios++;
            totalPergamino += kilosPergamino;
        }
    }

    const qqPergamino = totalPergamino / KG_PER_QQ;
    console.log(`  → ${totalBeneficios} procesos de beneficio`);
    console.log(`  → ${totalPergamino.toFixed(0)} kg de pergamino seco producido`);
    console.log(`  → ${qqPergamino.toFixed(1)} quintales equivalentes\n`);

    // ── Paso 9: Inventario (entradas desde beneficio + ventas) ──────────────
    console.log('📦  Generando inventario...');

    // Entradas: cada beneficio genera una entrada automática (simulando FLUJO 1)
    const beneficios = consultar('SELECT * FROM beneficio');
    let totalEntradas = 0;
    let totalVentas = 0;

    for (const b of beneficios) {
        if (b.kilos_pergamino_seco > 0) {
            const qq = parseFloat((b.kilos_pergamino_seco / KG_PER_QQ).toFixed(2));
            insertar('inventario', {
                tipo_producto: 'pergamino_seco',
                lote_id: b.lote_id,
                beneficio_id: b.id,
                tipo_movimiento: 'entrada',
                cantidad_qq: qq,
                cantidad_kg: b.kilos_pergamino_seco,
                fecha_movimiento: b.fecha_fin || b.fecha_inicio,
                ubicacion: 'Bodega Beneficio',
                observaciones: `Entrada automática desde beneficio #${b.id}`
            });
            totalEntradas++;
        }
    }

    // Ventas: vender ~60-70% del inventario en los meses de abril-agosto (post-cosecha)
    const inventarioEntradas = consultar("SELECT * FROM inventario WHERE tipo_movimiento = 'entrada'");

    for (const entrada of inventarioEntradas) {
        const fechaEntrada = new Date(entrada.fecha_movimiento);
        // Vender entre 1 y 12 meses después
        const mesesVenta = random.int(1, 12);
        const fechaVenta = new Date(fechaEntrada);
        fechaVenta.setMonth(fechaVenta.getMonth() + mesesVenta);

        // No vender en el futuro
        if (fechaVenta > range.end) continue;

        // Probabilidad de venta: 70%
        if (Math.random() > 0.7) continue;

        // Vender entre 30-100% del lote
        const porcentajeVenta = random.float(0.3, 1.0);
        const qqVenta = parseFloat((entrada.cantidad_qq * porcentajeVenta).toFixed(2));
        const precioVenta = random.int(1800, 3200); // L/qq según calidad

        const clienteVenta = random.pick(COMPRADORES);
        const fechaVentaTexto = fechaVenta.toISOString().split('T')[0];
        const facturaVenta = `FACT-${String(random.int(1000, 9999))}`;
        const totalVenta = parseFloat((qqVenta * precioVenta).toFixed(2));
        const movimientoVentaId = insertar('inventario', {
            tipo_producto: 'pergamino_seco',
            lote_id: entrada.lote_id,
            tipo_movimiento: 'venta',
            cantidad_qq: qqVenta,
            cantidad_kg: parseFloat((qqVenta * KG_PER_QQ).toFixed(1)),
            fecha_movimiento: fechaVentaTexto,
            cliente_destino: clienteVenta,
            precio_venta_qq: precioVenta,
            total_venta: totalVenta,
            factura: facturaVenta,
            observaciones: `Venta de café pergamino seco - lote ${entrada.lote_id}`
        });
        insertar('ventas_cafe', {
            codigo: `VTA-DEMO-${String(totalVentas + 1).padStart(5, '0')}`,
            fecha: fechaVentaTexto,
            cliente: clienteVenta,
            identificacion_cliente: `RTN-DEMO-${String(totalVentas + 1).padStart(4, '0')}`,
            tipo_producto: 'pergamino_seco',
            lote_id: entrada.lote_id,
            cantidad_kg: parseFloat((qqVenta * KG_PER_QQ).toFixed(1)),
            cantidad_qq: qqVenta,
            precio_por_kg: parseFloat((precioVenta / KG_PER_QQ).toFixed(4)),
            precio_por_qq: precioVenta,
            total_venta: totalVenta,
            factura: facturaVenta,
            destino: random.pick(['San Pedro Sula','Tegucigalpa','Puerto Cortés','La Ceiba','Copán Ruinas']),
            condicion_entrega: random.pick(['Retiro en bodega','Entregado en destino','Puesto en beneficio']),
            observaciones: 'Venta demostrativa vinculada al inventario.',
            inventario_id: movimientoVentaId,
            estado: 'confirmada'
        });
        totalVentas++;
    }

    // Salidas internas (pequeñas pérdidas/mermas)
    for (let i = 0; i < random.int(5, 12); i++) {
        const entradaRef = random.pick(inventarioEntradas);
        const fecha = new Date(entradaRef.fecha_movimiento);
        fecha.setMonth(fecha.getMonth() + random.int(2, 8));
        if (fecha > range.end) continue;

        insertar('inventario', {
            tipo_producto: 'pergamino_seco',
            lote_id: entradaRef.lote_id,
            tipo_movimiento: 'salida',
            cantidad_qq: parseFloat(random.float(0.5, 3).toFixed(2)),
            cantidad_kg: 0,
            fecha_movimiento: fecha.toISOString().split('T')[0],
            observaciones: 'Merma por control de calidad / reacondicionamiento'
        });
    }

    let totalInventario = totalEntradas + totalVentas;
    console.log(`  → ${totalInventario} movimientos de inventario`);
    console.log(`  → ${totalVentas} ventas registradas\n`);

    // ── Paso 10: Gastos ────────────────────────────────────────────────────
    console.log('💰  Generando gastos de producción...');

    let totalGastos = 0;
    let totalMontoGastos = 0;

    // Generar gastos mensuales por lote
    for (const loteId of loteIds) {
        const current = new Date(range.start);
        while (current <= range.end) {
            const month = current.getMonth();
            const year = current.getFullYear();
            const seasonWeight = random.seasonalWeight(month);

            // Probabilidad de gasto según temporada (más en mayo-sept = preparación)
            const probGasto = month >= 4 && month <= 8 ? 0.65 : 0.35;

            if (Math.random() < probGasto) {
                // 1-3 gastos por lote por mes
                const numGastos = random.int(1, 3);
                for (let g = 0; g < numGastos; g++) {
                    const categoria = random.pick(CATEGORIAS_GASTO);
                    const descripcion = random.pick(DESC_GASTO[categoria] || [categoria]);
                    const cantidad = random.float(1, 20);
                    const costoUnitario = categoria === 'fertilizante' ? random.float(300, 800) :
                        categoria === 'mano_obra' ? random.float(250, 500) :
                        random.float(100, 1500);
                    const costoTotal = parseFloat((cantidad * costoUnitario).toFixed(2));
                    const dia = random.int(1, 28);
                    const fechaGasto = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

                    insertar('gastos', {
                        lote_id: loteId,
                        fecha: fechaGasto,
                        categoria: categoria,
                        descripcion: descripcion,
                        cantidad: parseFloat(cantidad.toFixed(1)),
                        unidad_medida: categoria === 'fertilizante' ? 'sacos' :
                            categoria === 'mano_obra' ? 'jornales' : 'unidades',
                        costo_unitario: parseFloat(costoUnitario.toFixed(2)),
                        costo_total: costoTotal,
                        proveedor: random.pick(PROVEEDORES_GASTO) || '',
                        factura_comprobante: categoria !== 'mano_obra' ? `FV-${year}-${String(random.int(100, 999))}` : ''
                    });

                    totalGastos++;
                    totalMontoGastos += costoTotal;
                }
            }

            // Avanzar al siguiente mes
            current.setMonth(current.getMonth() + 1);
        }
    }

    console.log(`  → ${totalGastos} gastos registrados`);
    console.log(`  → L ${totalMontoGastos.toFixed(2)} en gastos totales\n`);

    // ── Paso 11: Módulos complementarios ───────────────────────────────────
    console.log('🌿  Generando sostenibilidad, calidad, trazabilidad, marketing y clima...');
    let totalComplementarios = 0;

    const isoDate = (date) => date.toISOString().split('T')[0];
    const shiftDays = (base, days) => {
        const date = new Date(base);
        date.setDate(date.getDate() + days);
        return date;
    };

    // Sostenibilidad: emisiones y prácticas regenerativas por lote.
    const factoresCo2 = {
        fertilizante: 1.82,
        combustible: 2.68,
        energia: 0.42,
        transporte: 0.18,
        otros: 0.75
    };
    const practicas = [
        ['compostaje', 'Compost producido con pulpa de café y material vegetal de la finca.'],
        ['agroforesteria', 'Manejo de sombra con especies nativas y árboles frutales.'],
        ['cobertura', 'Cobertura viva para proteger suelo, humedad y microbiología.'],
        ['curvas_nivel', 'Trazado y mantenimiento de curvas a nivel para reducir erosión.'],
        ['barreras_vivas', 'Barreras vivas en pendientes y zonas de escorrentía.'],
        ['cortinas_rompevientos', 'Protección del cultivo con árboles en bordes expuestos.']
    ];

    for (const loteId of loteIds) {
        for (const tipo of ['fertilizante', 'combustible', 'transporte']) {
            const cantidad = random.float(tipo === 'fertilizante' ? 120 : 20, tipo === 'fertilizante' ? 460 : 95);
            insertar('huella_carbono', {
                lote_id: loteId,
                fecha: random.dateStr(shiftDays(range.end, -540), range.end),
                tipo_emision: tipo,
                cantidad_kg: cantidad,
                co2e_kg: parseFloat((cantidad * factoresCo2[tipo]).toFixed(2)),
                notas: tipo === 'fertilizante'
                    ? 'Estimación basada en aplicaciones registradas durante el ciclo productivo.'
                    : 'Registro demostrativo para análisis ambiental y comparación por lote.'
            });
            totalComplementarios++;
        }

        for (const [tipo, notas] of random.pickN(practicas, 2)) {
            const inicio = random.date(shiftDays(range.end, -900), shiftDays(range.end, -180));
            insertar('practicas_regenerativas', {
                lote_id: loteId,
                tipo_practica: tipo,
                fecha_inicio: isoDate(inicio),
                fecha_fin: null,
                area_mz: random.float(0.8, 4.5),
                activo: 1,
                notas
            });
            totalComplementarios++;
        }
    }

    // Calidad: evaluaciones SCA vinculadas a procesos reales de beneficio.
    const notasCatacion = [
        'Chocolate, panela, naranja dulce y final limpio.',
        'Caramelo, cacao, ciruela madura y acidez cítrica brillante.',
        'Miel, almendra, frutos rojos y cuerpo cremoso.',
        'Azúcar morena, manzana roja, especias suaves y final prolongado.',
        'Jazmín, melocotón, cacao fino y acidez málica balanceada.'
    ];
    const evaluadores = ['María Fernanda Pineda', 'Carlos Mejía — Q Grader', 'Laboratorio Escuela Superior del Café'];
    const beneficiosEvaluados = random.pickN(beneficios, Math.min(36, beneficios.length));
    for (const beneficio of beneficiosEvaluados) {
        const puntaje = random.float(80.25, 88.75, 2);
        insertar('calidad_evaluaciones', {
            beneficio_id: beneficio.id,
            lote_id: beneficio.lote_id,
            fecha: beneficio.fecha_fin || beneficio.fecha_inicio || random.dateStr(range.start, range.end),
            puntaje_sca: puntaje,
            fragancia: random.float(7.25, 9.0, 2),
            sabor: random.float(7.25, 9.0, 2),
            acidez: random.float(7.0, 8.75, 2),
            cuerpo: random.float(7.0, 8.75, 2),
            uniformidad: 10,
            taza_limpia: 10,
            dulzor: 10,
            notas_catacion: random.pick(notasCatacion),
            evaluador: random.pick(evaluadores)
        });
        totalComplementarios++;
    }

    // Trazabilidad: un origen por lote y una cadena hash auditable.
    const trazas = [];
    for (const loteId of loteIds) {
        const cosecha = consultarUna(
            'SELECT id, fecha, kilos_estimados FROM recoleccion WHERE lote_id = ? ORDER BY fecha DESC LIMIT 1',
            [loteId]
        );
        const beneficio = consultarUna(
            'SELECT id, fecha_inicio, kilos_pergamino_seco FROM beneficio WHERE lote_id = ? ORDER BY fecha_inicio DESC LIMIT 1',
            [loteId]
        );
        const inventario = consultarUna(
            "SELECT id, fecha_movimiento, cantidad_kg FROM inventario WHERE lote_id = ? AND tipo_movimiento = 'entrada' ORDER BY fecha_movimiento DESC LIMIT 1",
            [loteId]
        );
        const code = `CAF-HN-${String(loteId).padStart(3, '0')}-${range.end.getFullYear()}`;
        insertar('lotes_origen', {
            codigo_trazabilidad: code,
            lote_id: loteId,
            cosecha_id: cosecha ? cosecha.id : null,
            beneficio_id: beneficio ? beneficio.id : null,
            inventario_id: inventario ? inventario.id : null,
            venta_id: null
        });
        totalComplementarios++;

        if (cosecha) trazas.push({ tipo: 'cosecha', id: cosecha.id, fecha: cosecha.fecha, loteId, resumen: cosecha });
        if (beneficio) trazas.push({ tipo: 'beneficio', id: beneficio.id, fecha: beneficio.fecha_inicio, loteId, resumen: beneficio });
        if (inventario) trazas.push({ tipo: 'inventario', id: inventario.id, fecha: inventario.fecha_movimiento, loteId, resumen: inventario });
    }

    trazas.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    let hashAnterior = 'GENESIS';
    for (const [index, traza] of trazas.entries()) {
        const timestamp = `${traza.fecha || range.endStr}T12:00:00.000Z`;
        const datosResumen = JSON.stringify({ lote_id: traza.loteId, ...traza.resumen });
        const nonce = index + 1000;
        const hashBloque = crypto
            .createHash('sha256')
            .update(`${hashAnterior || 'GENESIS'}|${traza.tipo}|${traza.id}|${timestamp}|${datosResumen}|${nonce}`)
            .digest('hex');
        insertar('bloques_trazabilidad', {
            hash_bloque: hashBloque,
            hash_anterior: hashAnterior,
            tipo_registro: traza.tipo,
            registro_id: traza.id,
            timestamp,
            datos_resumen: datosResumen,
            nonce
        });
        hashAnterior = hashBloque;
        totalComplementarios++;
    }

    // Marketing y fidelización: cartera demostrativa y campañas accionables.
    const clientesDemo = [
        ['Tostaduría Copán', 'compras@tostaduriacopan.example', '+504 0000-0000', 'Chocolate y caramelo', 'mensual'],
        ['Café del Lago', 'abastecimiento@cafedellago.example', '+504 0000-0000', 'Frutal y floral', 'quincenal'],
        ['Roast House SPS', 'hola@roasthousesps.example', '+504 0000-0000', 'Cítrico y brillante', 'mensual'],
        ['Hotel Montaña Verde', 'alimentos@montanaverde.example', '+504 0000-0000', 'Dulce y balanceado', 'trimestral'],
        ['Mercado Catracho', 'compras@mercadocatracho.example', '+504 0000-0000', 'Chocolate intenso', 'mensual'],
        ['Café Isla Bonita', 'gerencia@cafeislabonita.example', '+504 0000-0000', 'Suave y aromático', 'quincenal'],
        ['Honduras Specialty Imports', 'quality@hsi.example', '+1 555 0100', 'Microlotes 85+', 'trimestral'],
        ['La Ruta del Café', 'pedidos@larutadelcafe.example', '+504 0000-0000', 'Panela y frutos rojos', 'mensual'],
        ['Taza de Altura', 'contacto@tazadealtura.example', '+504 0000-0000', 'Floral y té negro', 'mensual'],
        ['Café Escuela HN', 'laboratorio@cafeescuela.example', '+504 0000-0000', 'Perfiles experimentales', 'trimestral']
    ];
    const clienteIds = [];
    for (const [nombre, email, telefono, preferencia, frecuencia] of clientesDemo) {
        const puntos = random.int(120, 1850);
        const id = insertar('clientes_marketing', {
            nombre,
            email,
            telefono,
            preferencia_sabor: preferencia,
            frecuencia_compra: frecuencia,
            ultima_compra: random.dateStr(shiftDays(range.end, -180), range.end),
            puntos_lealtad: puntos,
            activo: 1
        });
        clienteIds.push(id);
        insertar('lealtad_puntos', {
            cliente_id: id,
            puntos,
            concepto: 'Saldo acumulado por compras de café de origen y participación en cataciones.'
        });
        insertar('recomendaciones_cliente', {
            cliente_id: id,
            lote_id: random.pick(loteIds),
            fecha_recomendacion: random.dateStr(shiftDays(range.end, -120), range.end),
            feedback: random.pick(['gusto', 'gusto', 'pendiente', 'no_gusto'])
        });
        totalComplementarios += 3;
    }

    const campanas = [
        ['Cosecha nueva de Santa Bárbara', 'email', 'Presentación de lotes disponibles, perfiles de taza y trazabilidad completa.', 'completada', -120, -90],
        ['Conozca el origen de su taza', 'redes', 'Serie educativa sobre finca, recolectores, beneficio y prácticas sostenibles.', 'activa', -30, 45],
        ['Club Cafetal — clientes frecuentes', 'lealtad', 'Beneficios y degustaciones para compradores recurrentes.', 'activa', -15, 120],
        ['Microlotes según su perfil', 'recomendacion', 'Recomendaciones personalizadas con base en preferencias y evaluaciones SCA.', 'borrador', 15, 90]
    ];
    for (const [nombre, tipo, contenido, estado, inicio, fin] of campanas) {
        insertar('campanas_marketing', {
            nombre,
            tipo,
            contenido,
            fecha_inicio: isoDate(shiftDays(range.end, inicio)),
            fecha_fin: isoDate(shiftDays(range.end, fin)),
            estado
        });
        totalComplementarios++;
    }

    // Clima: 365 días de historia, lectura API demo y alertas relacionadas con la finca.
    const climateDemoDays = [];
    for (let day = 364; day >= 0; day--) {
        const fecha = shiftDays(range.end, -day);
        const month = fecha.getMonth();
        const rainySeason = month >= 4 && month <= 10;
        const rain = rainySeason
            ? Math.max(0, random.float(0, 34) - (Math.random() < 0.25 ? 12 : 0))
            : Math.max(0, random.float(0, 9) - (Math.random() < 0.65 ? 8 : 0));
        const tempMax = random.float(23.5, 30.8, 1);
        const tempMin = random.float(13.2, 19.6, 1);
        const tempCurrent = parseFloat(((tempMax + tempMin) / 2 + random.float(-1.2, 1.2)).toFixed(1));
        const humidity = random.float(rainySeason ? 72 : 58, rainySeason ? 96 : 82, 1);
        const wind = random.float(1.2, 13.5, 1);
        const pressure = random.float(846, 870, 1);
        const weatherCode = rain > 15 ? 63 : rain > 1 ? 61 : humidity > 88 ? 45 : 2;
        const row = {
            fecha: isoDate(fecha),
            precipitacion_mm: parseFloat(rain.toFixed(1)),
            temp_actual: tempCurrent,
            sensacion_termica: parseFloat((tempCurrent + (humidity > 80 ? 0.8 : -0.3)).toFixed(1)),
            presion_superficie_hpa: pressure,
            temp_max: tempMax,
            temp_min: tempMin,
            humedad_relativa: humidity,
            velocidad_viento: wind,
            codigo_clima: weatherCode,
            latitud: 14.9167,
            longitud: -88.2333,
            ubicacion_nombre: 'Santa Bárbara, Honduras',
            zona_horaria: 'America/Tegucigalpa',
            consultado_en: `${isoDate(fecha)}T12:00:00-06:00`,
            fuente: day < 30 ? 'open-meteo demo' : 'registro histórico demo',
            notas: rain > 25 ? 'Lluvia fuerte; revisar drenajes y acceso a lotes.' : ''
        };
        insertar('registros_clima', row);
        climateDemoDays.push(row);
        totalComplementarios++;
    }

    const recentClimate = climateDemoDays.slice(-7);
    const currentClimate = recentClimate[recentClimate.length - 1];
    const climateCachePayload = {
        provider: 'Open-Meteo', latitude: 14.9167, longitude: -88.2333, elevation: 1420,
        timezone: 'America/Tegucigalpa', timezoneAbbreviation: 'CST', locationName: 'Santa Bárbara, Honduras',
        fetchedAt: `${currentClimate.fecha}T12:00:00.000Z`,
        current: {
            time: `${currentClimate.fecha}T12:00`, temperature: currentClimate.temp_actual,
            relativeHumidity: currentClimate.humedad_relativa, surfacePressure: currentClimate.presion_superficie_hpa,
            apparentTemperature: currentClimate.sensacion_termica, precipitation: currentClimate.precipitacion_mm,
            rain: currentClimate.precipitacion_mm, weatherCode: currentClimate.codigo_clima,
            weatherLabel: currentClimate.codigo_clima === 63 ? 'Lluvia moderada' : currentClimate.codigo_clima === 61 ? 'Lluvia ligera' : currentClimate.codigo_clima === 45 ? 'Niebla' : 'Parcialmente nublado',
            windSpeed: currentClimate.velocidad_viento, windDirection: 110,
            units: { temperature: '°C', relativeHumidity: '%', surfacePressure: 'hPa', precipitation: 'mm', windSpeed: 'km/h' }
        },
        daily: recentClimate.map(item => ({
            date: item.fecha, temperatureMax: item.temp_max, temperatureMin: item.temp_min,
            precipitationSum: item.precipitacion_mm, precipitationProbability: Math.min(95, Math.round(item.humedad_relativa)),
            weatherCode: item.codigo_clima, weatherLabel: item.codigo_clima === 63 ? 'Lluvia moderada' : item.codigo_clima === 61 ? 'Lluvia ligera' : item.codigo_clima === 45 ? 'Niebla' : 'Parcialmente nublado',
            windSpeedMax: item.velocidad_viento
        })),
        extractionAlerts: currentClimate.humedad_relativa > 70
            ? [{ code: 'humidity-high', level: 'danger', title: 'Humedad ambiental alta', message: 'La humedad supera 70%. Para extracción de espresso, ensanche ligeramente la molienda y verifique nuevamente el tiempo de extracción antes de fijar el ajuste.' }]
            : [{ code: 'humidity-stable', level: 'success', title: 'Humedad ambiental estable', message: 'Mantenga la receta y confirme el resultado en taza antes de cambiar la molienda.' }]
    };
    insertar('clima_api_cache', {
        cache_key: '14.9167,-88.2333', proveedor: 'Open-Meteo', payload_json: JSON.stringify(climateCachePayload),
        fetched_at: climateCachePayload.fetchedAt, updated_at: climateCachePayload.fetchedAt
    });

    const alertas = [
        ['roya', 'medio', -42, 20, 'Realizar muestreo por lote, manejo de sombra y control preventivo según asistencia técnica.'],
        ['broca', 'alto', -18, 30, 'Recolectar frutos maduros y caídos, instalar trampas y registrar incidencia semanal.'],
        ['sequia', 'bajo', -8, 15, 'Conservar cobertura vegetal y priorizar riego en plantas jóvenes.'],
        ['inundacion', 'medio', -95, -82, 'Limpiar drenajes, revisar erosión y restringir tránsito en suelos saturados.']
    ];
    for (const [tipo, nivel, inicio, fin, recomendacion] of alertas) {
        insertar('alertas_fitosanitarias', {
            lote_id: random.pick(loteIds),
            tipo_alerta: tipo,
            nivel,
            fecha_inicio: isoDate(shiftDays(range.end, inicio)),
            fecha_fin: fin > 0 ? isoDate(shiftDays(range.end, fin)) : isoDate(shiftDays(range.end, fin)),
            activa: fin > 0 ? 1 : 0,
            recomendacion
        });
        totalComplementarios++;
    }


    // Planillas de corte: captura semanal tipo matriz para cuadrillas.
    const harvestYear = range.end.getMonth() >= 8 ? range.end.getFullYear() : range.end.getFullYear() - 1;
    const seasonStart = new Date(harvestYear, 9, 1);
    const seasonEnd = new Date(harvestYear + 1, 2, 31);
    const temporadaId = insertar('temporadas_cafe', {
        nombre: `Cosecha ${harvestYear}-${harvestYear + 1}`,
        fecha_inicio: isoDate(seasonStart), fecha_fin: isoDate(seasonEnd), estado: 'activa',
        precio_unidad_default: 42, unidad_default: 'lata', peso_lata_kg: 18,
        observaciones: 'Temporada demostrativa con planillas semanales por cuadrilla.'
    });
    totalComplementarios++;

    const monday = new Date(range.end);
    const mondayOffset = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - mondayOffset - 7);
    monday.setHours(0, 0, 0, 0);
    for (const loteId of loteIds.slice(0, 3)) {
        const weekEnd = shiftDays(monday, 4);
        const planillaId = insertar('planillas_corte', {
            temporada_id: temporadaId, lote_id: loteId, semana_inicio: isoDate(monday), semana_fin: isoDate(weekEnd),
            unidad: 'lata', precio_por_unidad: 42, peso_lata_kg: 18, dias_semana: 5,
            estado: 'pagada', observaciones: 'Planilla demostrativa de lunes a viernes.'
        });
        totalComplementarios++;
        for (const recolectorId of recolectorIds.slice(0, 12)) {
            for (let day = 0; day < 5; day++) {
                const quantity = random.float(2.5, 9.5, 1);
                insertar('recoleccion', {
                    lote_id: loteId, fecha: isoDate(shiftDays(monday, day)), recolector_id: recolectorId,
                    latas_recolectadas: quantity, kilos_estimados: parseFloat((quantity * 18).toFixed(2)),
                    peso_lata_kg: 18, tipo_madurez: random.pick(['maduro','maduro','maduro','pinton']),
                    precio_por_lata: 42, total_pagado: parseFloat((quantity * 42).toFixed(2)),
                    hora_inicio: '06:00', hora_fin: '15:30', observaciones: 'Registro generado desde planilla semanal demo.',
                    planilla_id: planillaId, unidad_corte: 'lata', cantidad_unidad: quantity
                });
                totalCosechas++;
            }
        }
    }

    // Acopio y compras: operación para beneficiadores que transforman café de terceros.
    const proveedoresCafe = [
        ['PRV-DEMO-001','Productores Unidos de El Níspero','cooperativa','Santa Bárbara','Comercio Justo'],
        ['PRV-DEMO-002','Finca La Esperanza','productor','Peña Blanca, Cortés','Café de altura'],
        ['PRV-DEMO-003','Beneficio Comunitario Los Pinos','beneficio','La Campa, Lempira',''],
        ['PRV-DEMO-004','Asociación Mujeres del Café','cooperativa','Copán Ruinas, Copán','Orgánico'],
        ['PRV-DEMO-005','Juan Antonio Mejía','productor','Atima, Santa Bárbara','']
    ];
    const proveedorCafeIds = [];
    for (const [codigo,nombre,tipo,ubicacion,certificaciones] of proveedoresCafe) {
        proveedorCafeIds.push(insertar('proveedores_cafe', {
            codigo, nombre, tipo, identificacion: `DEMO-${codigo.slice(-3)}`, telefono: '0000-0000',
            email: `${codigo.toLowerCase()}@example.com`, ubicacion, certificaciones, activo: 1
        }));
        totalComplementarios++;
    }

    const comprasDemo = [
        ['cereza', 2250, 13.8, null, 'aprobado', 'Lote externo CE-18'],
        ['pergamino_humedo', 920, 47.5, 35.0, 'condicionado', 'Recepción para secado controlado'],
        ['pergamino_seco', 1380, 78.0, 11.2, 'aprobado', 'Compra por peso y muestra física'],
        ['verde', 690, 108.0, 10.8, 'aprobado', 'Café verde clasificado'],
        ['pergamino_seco', 460, 72.0, 15.8, 'rechazado', 'Humedad fuera de especificación demo']
    ];
    for (let index = 0; index < comprasDemo.length; index++) {
        const [tipoProducto, kg, priceKg, humidity, status, notes] = comprasDemo[index];
        const quantityQq = parseFloat((kg / KG_PER_QQ).toFixed(4));
        const purchaseId = insertar('compras_cafe', {
            codigo: `CMP-DEMO-${String(index + 1).padStart(4,'0')}`,
            proveedor_id: proveedorCafeIds[index % proveedorCafeIds.length],
            fecha: isoDate(shiftDays(range.end, -(index * 8 + 3))),
            temporada: `Cosecha ${harvestYear}-${harvestYear + 1}`, tipo_producto: tipoProducto,
            cantidad_kg: kg, cantidad_qq: quantityQq, precio_por_kg: priceKg,
            precio_por_qq: parseFloat((priceKg * KG_PER_QQ).toFixed(2)), costo_total: parseFloat((kg * priceKg).toFixed(2)),
            humedad_porcentaje: humidity, defectos_porcentaje: random.float(1.2, 7.5, 1),
            variedad: random.pick(['Catuaí','Lempira','IHCAFE 90','Parainema']), origen_geografico: proveedoresCafe[index % proveedoresCafe.length][3],
            finca_origen: proveedoresCafe[index % proveedoresCafe.length][1], lote_proveedor: `EXT-${index + 1}`,
            factura_comprobante: `FAC-DEMO-${100 + index}`, estado_calidad: status,
            ubicacion_recepcion: 'Bodega de acopio principal', observaciones: notes
        });
        totalComplementarios++;
        if (status === 'aprobado' || status === 'condicionado') {
            const inventoryId = insertar('inventario', {
                tipo_producto: tipoProducto, lote_id: null, beneficio_id: null, tipo_movimiento: 'entrada',
                cantidad_qq: quantityQq, cantidad_kg: kg, fecha_movimiento: isoDate(shiftDays(range.end, -(index * 8 + 3))),
                ubicacion: 'Bodega de acopio principal', cliente_destino: null, precio_venta_qq: null, total_venta: null,
                factura: `FAC-DEMO-${100 + index}`, observaciones: `Ingreso por compra ${purchaseId}.`, compra_id: purchaseId,
                costo_origen: parseFloat((kg * priceKg).toFixed(2))
            });
            ejecutarSQL(`UPDATE compras_cafe SET inventario_id = ${Number(inventoryId)} WHERE id = ${Number(purchaseId)}`);
            totalInventario++;
        }
    }

    // Progreso educativo de ejemplo para mostrar una experiencia activa.
    const firstArticles = consultar('SELECT id FROM articulos ORDER BY id LIMIT 3');
    firstArticles.forEach((article, index) => {
        insertar('progreso_educacion', {
            usuario_id: 1, articulo_id: article.id, estado: index === 0 ? 'completado' : 'iniciado',
            progreso_porcentaje: index === 0 ? 100 : 25 + index * 20,
            ultima_lectura: `${range.endStr} 10:00:00`
        });
        totalComplementarios++;
    });

    console.log(`  → ${totalComplementarios} registros complementarios generados\n`);

    // ── Resumen ────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊  RESUMEN DE DATOS GENERADOS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Finca:         ${FINCA_DEMO.nombre}`);
    console.log(`  Años:          ${years} (${range.startStr} → ${range.endStr})`);
    console.log(`  Lotes:         ${loteIds.length}`);
    console.log(`  Recolectores:  ${recolectorIds.length}`);
    console.log(`  Cosechas:      ${totalCosechas}`);
    console.log(`  Beneficios:    ${totalBeneficios}`);
    console.log(`  Inventario:    ${totalInventario} movimientos`);
    console.log(`  Gastos:        ${totalGastos}`);
    console.log(`  Complementos:  ${totalComplementarios}`);
    console.log('─────────────────────────────────────────────────────────');
    const totalRegistros = 1 + loteIds.length + recolectorIds.length + totalCosechas +
        totalBeneficios + totalInventario + totalGastos + totalComplementarios;
    console.log(`  Total registros: ~${totalRegistros}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // ── Guardar DB ──────────────────────────────────────────────────────────
    console.log('💾  Guardando base de datos...');
    const dbPath = FLAGS.output;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log(`✓  Base de datos guardada en: ${dbPath}`);
    console.log(`   Tamaño: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // ── Cerrar DB ───────────────────────────────────────────────────────────
    db.close();

    return { path: dbPath, records: totalRegistros };
}

// ─── Ejecución ───────────────────────────────────────────────────────────────
(async () => {
    try {
        await generarDemo(FLAGS.years);
        console.log('\n✅  ¡Demo generada exitosamente!');
        console.log('▶  Para abrirla con la aplicación ejecute: npm run demo');
        console.log('   Para regenerarla y reiniciar la copia de trabajo: npm run demo:reset\n');
    } catch (err) {
        console.error('\n✗  Error durante la generación:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
