-- Datos exclusivamente sintéticos para la experiencia demo.
-- No se cargan en una instalación productiva nueva.

INSERT OR IGNORE INTO recolectores (nombre_completo, identificacion, telefono) VALUES
    ('Juan Pérez', 'DEMO-0001', '9990-0001'),
    ('María López', 'DEMO-0002', '9990-0002'),
    ('Pedro García', 'DEMO-0003', '9990-0003'),
    ('Ana Hernández', 'DEMO-0004', '9990-0004'),
    ('Carlos Martínez', 'DEMO-0005', '9990-0005');

INSERT OR IGNORE INTO certificaciones (finca_id, tipo, entidad_certificadora, fecha_obtencion, activo) VALUES
    (1, 'organico', 'Entidad demostrativa', '2024-03-15', 1);

INSERT OR IGNORE INTO precios_historicos (fecha, tipo_cafe, precio_usd_kg, precio_hnl_qq, fuente) VALUES
    ('2026-07-01', 'arabica', 8.47, 10129, 'Dato sintético demo'),
    ('2026-07-01', 'robusta', 4.86, 5813, 'Dato sintético demo'),
    ('2026-06-15', 'arabica', 8.35, 9987, 'Dato sintético demo'),
    ('2026-06-01', 'arabica', 8.22, 9831, 'Dato sintético demo'),
    ('2026-05-15', 'arabica', 8.10, 9689, 'Dato sintético demo'),
    ('2026-05-01', 'arabica', 7.95, 9508, 'Dato sintético demo'),
    ('2026-04-15', 'arabica', 7.82, 9353, 'Dato sintético demo'),
    ('2026-04-01', 'arabica', 7.68, 9185, 'Dato sintético demo'),
    ('2026-03-15', 'arabica', 7.55, 9030, 'Dato sintético demo'),
    ('2026-03-01', 'arabica', 7.42, 8874, 'Dato sintético demo'),
    ('2026-02-15', 'arabica', 7.30, 8731, 'Dato sintético demo'),
    ('2026-02-01', 'arabica', 7.18, 8587, 'Dato sintético demo'),
    ('2026-01-15', 'arabica', 7.05, 8432, 'Dato sintético demo'),
    ('2026-01-01', 'arabica', 6.92, 8276, 'Dato sintético demo');

INSERT OR IGNORE INTO benchmarks (año, indicador, valor_promedio_nacional, valor_top_25, valor_top_10) VALUES
    (2026, 'rendimiento_qq_mz', 18.5, 25.0, 32.0),
    (2026, 'costo_produccion_qq', 3200, 2800, 2400),
    (2026, 'precio_promedio_venta', 4500, 5200, 6000);
