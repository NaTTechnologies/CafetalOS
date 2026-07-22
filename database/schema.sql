-- ============================================
-- Cafetal OS — Esquema de Base de Datos
-- ============================================

CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL
);

INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('moneda_simbolo', 'L');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('moneda_codigo', 'HNL');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('unidad_area', 'Manzana');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('unidad_recoleccion', 'Lata');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('unidad_comercial', 'Quintal');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('peso_lata_kg', '18');

INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_nombre_organizacion', 'Mi Finca Cafetalera');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_identificacion', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_direccion', 'Honduras');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_telefono', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_email', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_sitio_web', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_responsable', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_logo_path', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_color_primario', '#17382C');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_color_secundario', '#D7A946');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_pie', 'Documento generado localmente por Cafetal OS.');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_mostrar_logo', '1');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('operacion_tipo', 'mixta');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('cosecha_dias_semana', '5');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('compra_control_calidad', '1');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('reporte_logo_predeterminado', 'cafetal-os');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_proveedor', 'open-meteo');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_geocodificador', 'open-meteo');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_cache_ttl_minutos', '30');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_latitud', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_longitud', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_ubicacion_nombre', '');
INSERT OR IGNORE INTO configuracion (clave, valor) VALUES ('clima_zona_horaria', 'auto');


CREATE TABLE IF NOT EXISTS variedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    rendimiento_esperado_qq_mz REAL
);

CREATE TABLE IF NOT EXISTS finca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL DEFAULT 'Mi Finca',
    ubicacion TEXT,
    altitud_msnm INTEGER,
    area_total_mz REAL DEFAULT 0,
    area_cafe_mz REAL DEFAULT 0,
    certificaciones TEXT,
    coordenadas TEXT,
    fecha_registro DATE DEFAULT (date('now')),
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER NOT NULL DEFAULT 1,
    codigo TEXT NOT NULL,
    area_mz REAL NOT NULL DEFAULT 0,
    variedad_id INTEGER,
    año_siembra INTEGER,
    densidad_plantas_mz INTEGER,
    altitud_lote_msnm INTEGER,
    exposicion TEXT,
    tipo_suelo TEXT,
    estado TEXT DEFAULT 'produccion' CHECK (estado IN ('produccion','reposicion','descanso','nuevo')),
    observaciones TEXT,
    es_sistema INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    fecha_registro DATE DEFAULT (date('now')),
    FOREIGN KEY (finca_id) REFERENCES finca(id) ON DELETE CASCADE,
    FOREIGN KEY (variedad_id) REFERENCES variedades(id),
    UNIQUE (finca_id, codigo)
);

CREATE TABLE IF NOT EXISTS recolectores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_completo TEXT NOT NULL,
    identificacion TEXT,
    telefono TEXT,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS recoleccion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    recolector_id INTEGER,
    latas_recolectadas REAL NOT NULL DEFAULT 0,
    kilos_estimados REAL,
    peso_lata_kg REAL DEFAULT 18.0,
    tipo_madurez TEXT DEFAULT 'maduro' CHECK (tipo_madurez IN ('maduro','verde','pinton','sobremaduro','mixto')),
    precio_por_lata REAL DEFAULT 0,
    total_pagado REAL DEFAULT 0,
    hora_inicio TIME,
    hora_fin TIME,
    observaciones TEXT,
    planilla_id INTEGER,
    unidad_corte TEXT DEFAULT 'lata' CHECK (unidad_corte IN ('lata','kg','canasta')),
    cantidad_unidad REAL,
    fecha_registro DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (recolector_id) REFERENCES recolectores(id),
    FOREIGN KEY (planilla_id) REFERENCES planillas_corte(id)
);

CREATE INDEX IF NOT EXISTS idx_recoleccion_fecha ON recoleccion(fecha);
CREATE INDEX IF NOT EXISTS idx_recoleccion_lote ON recoleccion(lote_id);

-- Agrupación semanal de cuadrillas y captura tipo planilla.
CREATE TABLE IF NOT EXISTS temporadas_cafe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('planificada','activa','cerrada')),
    precio_unidad_default REAL DEFAULT 0,
    unidad_default TEXT DEFAULT 'lata' CHECK (unidad_default IN ('lata','kg','canasta')),
    peso_lata_kg REAL DEFAULT 18,
    observaciones TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS planillas_corte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temporada_id INTEGER,
    lote_id INTEGER NOT NULL,
    semana_inicio DATE NOT NULL,
    semana_fin DATE NOT NULL,
    unidad TEXT NOT NULL DEFAULT 'lata' CHECK (unidad IN ('lata','kg','canasta')),
    precio_por_unidad REAL NOT NULL DEFAULT 0,
    peso_lata_kg REAL NOT NULL DEFAULT 18,
    dias_semana INTEGER NOT NULL DEFAULT 5 CHECK (dias_semana BETWEEN 1 AND 7),
    estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','confirmada','pagada')),
    observaciones TEXT,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (temporada_id) REFERENCES temporadas_cafe(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    UNIQUE (lote_id, semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_planillas_corte_semana ON planillas_corte(semana_inicio);


CREATE TABLE IF NOT EXISTS beneficio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    kilos_cereza_ingresados REAL NOT NULL DEFAULT 0,
    metodo TEXT DEFAULT 'lavado' CHECK (metodo IN ('lavado','honey','natural','semi-lavado')),
    horas_fermentacion REAL,
    tipo_secado TEXT DEFAULT 'sol' CHECK (tipo_secado IN ('sol','mecanico','combinado','silo')),
    dias_secado INTEGER,
    humedad_final_porcentaje REAL,
    kilos_pergamino_seco REAL DEFAULT 0,
    rendimiento_porcentaje REAL,
    observaciones TEXT,
    compra_id INTEGER,
    origen_tipo TEXT DEFAULT 'propio' CHECK (origen_tipo IN ('propio','comprado','mixto')),
    fecha_registro DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (compra_id) REFERENCES compras_cafe(id)
);

CREATE INDEX IF NOT EXISTS idx_beneficio_fecha ON beneficio(fecha_inicio);

CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_producto TEXT NOT NULL CHECK (tipo_producto IN ('cereza','pergamino_humedo','pergamino_seco','verde','tostado')),
    lote_id INTEGER,
    beneficio_id INTEGER,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN ('entrada','salida','venta')),
    cantidad_qq REAL NOT NULL DEFAULT 0,
    cantidad_kg REAL DEFAULT 0,
    fecha_movimiento DATE NOT NULL,
    ubicacion TEXT,
    cliente_destino TEXT,
    precio_venta_qq REAL,
    total_venta REAL,
    factura TEXT,
    observaciones TEXT,
    compra_id INTEGER,
    costo_origen REAL DEFAULT 0,
    fecha_registro DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (beneficio_id) REFERENCES beneficio(id),
    FOREIGN KEY (compra_id) REFERENCES compras_cafe(id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_fecha ON inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(tipo_producto);

CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER,
    fecha DATE NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('fertilizante','fungicida','herbicida','mano_obra','transporte','insumos','maquinaria','mantenimiento','servicios','otros')),
    descripcion TEXT NOT NULL,
    cantidad REAL DEFAULT 1,
    unidad_medida TEXT,
    costo_unitario REAL DEFAULT 0,
    costo_total REAL NOT NULL DEFAULT 0,
    proveedor TEXT,
    factura_comprobante TEXT,
    fecha_registro DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- ============================================
-- Acopio, compra y transformación de café de terceros
-- ============================================
CREATE TABLE IF NOT EXISTS proveedores_cafe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'productor' CHECK (tipo IN ('productor','intermediario','cooperativa','beneficio','exportador','otro')),
    identificacion TEXT,
    telefono TEXT,
    email TEXT,
    ubicacion TEXT,
    certificaciones TEXT,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS compras_cafe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    proveedor_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    temporada TEXT,
    tipo_producto TEXT NOT NULL CHECK (tipo_producto IN ('cereza','pergamino_humedo','pergamino_seco','verde','tostado')),
    cantidad_kg REAL NOT NULL DEFAULT 0,
    cantidad_qq REAL NOT NULL DEFAULT 0,
    precio_por_kg REAL DEFAULT 0,
    precio_por_qq REAL DEFAULT 0,
    costo_total REAL NOT NULL DEFAULT 0,
    humedad_porcentaje REAL,
    defectos_porcentaje REAL,
    variedad TEXT,
    origen_geografico TEXT,
    finca_origen TEXT,
    lote_proveedor TEXT,
    factura_comprobante TEXT,
    estado_calidad TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_calidad IN ('pendiente','aprobado','condicionado','rechazado')),
    ubicacion_recepcion TEXT,
    observaciones TEXT,
    inventario_id INTEGER,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores_cafe(id),
    FOREIGN KEY (inventario_id) REFERENCES inventario(id)
);

CREATE INDEX IF NOT EXISTS idx_compras_cafe_fecha ON compras_cafe(fecha);

-- Ventas comerciales vinculadas al kardex e inventario.
CREATE TABLE IF NOT EXISTS ventas_cafe (
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
CREATE INDEX IF NOT EXISTS idx_ventas_cafe_producto ON ventas_cafe(tipo_producto);
CREATE INDEX IF NOT EXISTS idx_compras_cafe_proveedor ON compras_cafe(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_cafe_producto ON compras_cafe(tipo_producto);


-- ============================================
-- Tablas para Módulo: Sostenibilidad
-- ============================================

CREATE TABLE IF NOT EXISTS huella_carbono (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER REFERENCES lotes(id),
    fecha TEXT NOT NULL,
    tipo_emision TEXT NOT NULL CHECK (tipo_emision IN ('fertilizante','combustible','energia','transporte','otros')),
    cantidad_kg REAL NOT NULL,
    co2e_kg REAL NOT NULL,
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS practicas_regenerativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER REFERENCES lotes(id),
    tipo_practica TEXT NOT NULL CHECK (tipo_practica IN ('compostaje','agroforesteria','cobertura','curvas_nivel','barreras_vivas','cortinas_rompevientos')),
    fecha_inicio TEXT,
    fecha_fin TEXT,
    area_mz REAL,
    activo INTEGER DEFAULT 1,
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS certificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finca_id INTEGER REFERENCES finca(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('organico','rainforest','comercio_justo','utz','carbon_neutral','bird_friendly','4c')),
    entidad_certificadora TEXT,
    fecha_obtencion TEXT,
    fecha_vencimiento TEXT,
    archivo_certificado TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Calidad / Evaluaciones
-- ============================================

CREATE TABLE IF NOT EXISTS calidad_evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beneficio_id INTEGER REFERENCES beneficio(id),
    lote_id INTEGER REFERENCES lotes(id),
    fecha TEXT NOT NULL,
    puntaje_sca REAL,
    fragancia REAL,
    sabor REAL,
    acidez REAL,
    cuerpo REAL,
    uniformidad REAL DEFAULT 10,
    taza_limpia REAL DEFAULT 10,
    dulzor REAL DEFAULT 10,
    notas_catacion TEXT,
    evaluador TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Trazabilidad Blockchain
-- ============================================

CREATE TABLE IF NOT EXISTS bloques_trazabilidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_bloque TEXT NOT NULL UNIQUE,
    hash_anterior TEXT,
    tipo_registro TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    datos_resumen TEXT,
    nonce INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS lotes_origen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_trazabilidad TEXT NOT NULL UNIQUE,
    lote_id INTEGER REFERENCES lotes(id),
    cosecha_id INTEGER REFERENCES recoleccion(id),
    beneficio_id INTEGER REFERENCES beneficio(id),
    inventario_id INTEGER REFERENCES inventario(id),
    venta_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Mercado
-- ============================================

CREATE TABLE IF NOT EXISTS precios_historicos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    tipo_cafe TEXT NOT NULL CHECK (tipo_cafe IN ('arabica','robusta')),
    precio_usd_kg REAL NOT NULL,
    precio_hnl_qq REAL NOT NULL,
    fuente TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    año INTEGER NOT NULL,
    indicador TEXT NOT NULL,
    valor_promedio_nacional REAL,
    valor_top_25 REAL,
    valor_top_10 REAL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Marketing Digital
-- ============================================

CREATE TABLE IF NOT EXISTS clientes_marketing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    preferencia_sabor TEXT,
    frecuencia_compra TEXT,
    ultima_compra TEXT,
    puntos_lealtad INTEGER DEFAULT 0,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS campanas_marketing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('email','redes','lealtad','recomendacion')),
    contenido TEXT,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','activa','completada','cancelada')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS lealtad_puntos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER REFERENCES clientes_marketing(id),
    puntos INTEGER NOT NULL,
    concepto TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Clima / Meteorología
-- ============================================

CREATE TABLE IF NOT EXISTS registros_clima (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    precipitacion_mm REAL,
    temp_max REAL,
    temp_min REAL,
    humedad_relativa REAL,
    velocidad_viento REAL,
    fuente TEXT DEFAULT 'manual',
    notas TEXT,
    temp_actual REAL,
    sensacion_termica REAL,
    presion_superficie_hpa REAL,
    codigo_clima INTEGER,
    latitud REAL,
    longitud REAL,
    ubicacion_nombre TEXT,
    zona_horaria TEXT,
    consultado_en TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS clima_api_cache (
    cache_key TEXT PRIMARY KEY,
    proveedor TEXT NOT NULL DEFAULT 'Open-Meteo',
    payload_json TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS alertas_fitosanitarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lote_id INTEGER REFERENCES lotes(id),
    tipo_alerta TEXT NOT NULL CHECK (tipo_alerta IN ('roya','broca','oteada','helada','sequia','inundacion')),
    nivel TEXT NOT NULL CHECK (nivel IN ('bajo','medio','alto')),
    fecha_inicio TEXT,
    fecha_fin TEXT,
    activa INTEGER DEFAULT 1,
    recomendacion TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Suscripción / Perfiles de Sabor
-- ============================================

CREATE TABLE IF NOT EXISTS perfiles_sabor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variedad_id INTEGER REFERENCES variedades(id),
    altitud_min INTEGER,
    altitud_max INTEGER,
    perfil_principal TEXT,
    nota_cata TEXT,
    intensidad INTEGER CHECK(intensidad BETWEEN 1 AND 5),
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS recomendaciones_cliente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER REFERENCES clientes_marketing(id),
    lote_id INTEGER REFERENCES lotes(id),
    fecha_recomendacion TEXT,
    feedback TEXT CHECK (feedback IN ('gusto','no_gusto','pendiente')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================
-- Tablas para Módulo: Educación / Contenido
-- ============================================

CREATE TABLE IF NOT EXISTS articulos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    resumen TEXT,
    contenido_texto TEXT,
    categoria TEXT CHECK (categoria IN ('metodos_preparacion','sostenibilidad','variedades','beneficio','tostion','comercializacion')),
    fuente TEXT,
    url_externa TEXT,
    icono TEXT DEFAULT '📖',
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS progreso_educacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    articulo_id INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'iniciado' CHECK (estado IN ('iniciado','completado')),
    progreso_porcentaje INTEGER DEFAULT 0 CHECK (progreso_porcentaje BETWEEN 0 AND 100),
    ultima_lectura DATETIME DEFAULT (datetime('now','localtime')),
    UNIQUE (usuario_id, articulo_id),
    FOREIGN KEY (articulo_id) REFERENCES articulos(id)
);

CREATE TABLE IF NOT EXISTS evaluaciones_educacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    articulo_id INTEGER,
    puntaje INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    respuestas TEXT,
    fecha DATETIME DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (articulo_id) REFERENCES articulos(id)
);

CREATE TABLE IF NOT EXISTS tips_contextuales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    contenido_tip TEXT NOT NULL,
    icono TEXT DEFAULT '💡',
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);
