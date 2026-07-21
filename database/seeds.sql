-- ============================================
-- Cafetal OS — Datos Semilla
-- Variedades de café hondureñas (IHCAFE)
-- ============================================

INSERT OR IGNORE INTO variedades (nombre, descripcion, rendimiento_esperado_qq_mz) VALUES
    ('Catuaí', 'Variedad de porte bajo, alta productividad. Ampliamente cultivada en Honduras.', 35),
    ('Parainema', 'Variedad resistente a nematodos y roya. Desarrollada por IHCAFE. Excelente calidad de taza.', 32),
    ('IHCAFE 90', 'Variedad mejorada del Catuaí, resistente a la roya. Creada por IHCAFE. Alta productividad.', 38),
    ('Lempira', 'Variedad resistente a la roya. Adaptable a diferentes altitudes. Buen rendimiento.', 36),
    ('Bourbon', 'Variedad tradicional de alta calidad de taza. Porte alto. Rendimiento moderado.', 25),
    ('Caturra', 'Mutación del Bourbon. Porte bajo. Buena calidad. Popular en Centroamérica.', 30),
    ('Typica', 'Variedad tradicional de excelente calidad. Porte alto. Rendimiento más bajo pero taza superior.', 22),
    ('Pacas', 'Mutación del Bourbon. Originaria de El Salvador. Porte bajo. Buena calidad.', 28),
    ('Maragogipe', 'Variedad de grano grande (elefante). Porte muy alto. Rendimiento bajo pero cotizado.', 15),
    ('Geisha', 'Variedad de alta gama. Taza excepcional con notas florales y cítricas. Alto valor comercial.', 20),
    ('Catuai', 'Híbrido de Catuaí y Mundo Novo. Porte bajo. Alta productividad.', 34),
    ('Oro Azteca', 'Variedad resistente a roya. Adaptada a condiciones de altura.', 30);


-- ============================================
-- Semillas para Módulo: Perfiles de Sabor
-- ============================================
INSERT OR IGNORE INTO perfiles_sabor (variedad_id, altitud_min, altitud_max, perfil_principal, nota_cata, intensidad) VALUES
    (1, 1000, 1400, 'chocolate', 'Chocolate con leche, caramelo, naranja', 3),
    (2, 800, 1200, 'citrico', 'Cítricos, miel, mandarina, panela', 3),
    (3, 1000, 1500, 'frutal', 'Frutos rojos, vino tinto, chocolate oscuro', 4),
    (4, 800, 1200, 'caramelo', 'Caramelo, almendra, cacao', 3),
    (5, 1200, 1600, 'floral', 'Jazmín, bergamota, durazno, té verde', 2),
    (6, 1000, 1400, 'chocolate', 'Chocolate con leche, nueces, frutas secas', 3),
    (7, 1300, 1700, 'herbal', 'Hierbas finas, cacao, tabaco', 4),
    (8, 1000, 1400, 'frutal', 'Frutas tropicales, cítricos, flores', 2),
    (9, 1200, 1600, 'chocolate', 'Chocolate, nueces, caramelo suave', 3),
    (10, 1400, 1800, 'floral', 'Jazmín, cacao fino, miel de abeja', 2),
    (11, 800, 1200, 'caramelo', 'Caramelo, cacao, panela, almendra', 3),
    (12, 1000, 1400, 'citrico', 'Cítricos, flores, miel de abeja', 3);

-- ============================================
-- Semillas para Módulo: Education - Tips Contextuales
-- ============================================
INSERT OR IGNORE INTO tips_contextuales (modulo, accion, contenido_tip, icono) VALUES
    ('beneficio', 'guardar', 'Un buen rendimiento en beneficio (>22%) comienza con una selección cuidadosa de la cereza madura y un control preciso de la fermentación.', '💡'),
    ('cosecha', 'guardar', 'La madurez óptima del grano es clave: el café maduro tiene el máximo contenido de azúcares y produce la mejor taza.', '🍒'),
    ('inventario', 'guardar', 'El pergamino seco debe almacenarse con humedad entre 10-12% en un lugar fresco, seco y ventilado para mantener su calidad.', '📦'),
    ('gastos', 'guardar', 'Llevar un control detallado de gastos por lote te permite calcular tu costo real de producción y tomar mejores decisiones.', '💰');

-- ============================================
-- Semillas para Módulo: Education - Artículos
-- ============================================
INSERT OR IGNORE INTO articulos (titulo, resumen, contenido_texto, categoria, icono, fuente) VALUES
    ('¿Qué es el Café de Especialidad?', 'Conoce los estándares SCA y qué hace que un café sea de especialidad (puntaje ≥ 80).', 'El café de especialidad se define por su puntaje SCA (Specialty Coffee Association). Para ser considerado de especialidad, un café debe obtener un puntaje mínimo de 80 puntos en una escala de 100, evaluado por catadores certificados. Los factores incluyen fragancia, sabor, acidez, cuerpo, uniformidad y taza limpia.', 'comercializacion', '🏆', 'SCA'),
    ('Guía de Variedades Hondureñas', 'IHCAFE 90, Parainema, Lempira, Catuaí... conoce las variedades más cultivadas en Honduras.', 'Honduras cultiva principalmente variedades arábicas. El IHCAFE (Instituto Hondureño del Café) ha desarrollado variedades resistentes a la roya como IHCAFE 90, Parainema y Lempira, que han revolucionado la caficultura nacional.', 'variedades', '🌳', 'IHCAFE'),
    ('Beneficio Húmedo Paso a Paso', 'Desde la cereza hasta el pergamino seco: despulpado, fermentación, lavado y secado.', 'El beneficio húmedo es el proceso estándar en Honduras. Incluye: 1) Despulpado: retirar la pulpa de la cereza, 2) Fermentación: 12-24 horas para descomponer el mucílago, 3) Lavado: con agua limpia, 4) Secado: al sol o mecánico hasta 10-12% de humedad.', 'beneficio', '🔄', 'IHCAFE'),
    ('Perfiles de Tueste para Café de Especialidad', 'Cómo el nivel de tueste afecta el sabor: claro, medio u oscuro para cada variedad.', 'El tueste desarrolla los sabores del café. Tueste claro (City): resalta acidez y notas florales. Tueste medio (Full City): balance perfecto. Tueste oscuro (Espresso): cuerpo completo, baja acidez.', 'tostion', '🔥', 'SCA'),
    ('Métodos de Preparación: Chemex', 'Guía completa para preparar café en Chemex.', 'La Chemex fue inventada en 1941. Proporción recomendada: 30g café / 450g agua. Temperatura: 92-96°C. Tiempo total: 4 minutos. Molienda: media-gruesa.', 'metodos_preparacion', '🧪', 'SCA'),
    ('Certificaciones de Café: ¿Cuál elegir?', 'Orgánico, Rainforest, Comercio Justo, Bird Friendly.', 'Las certificaciones son importantes para acceder a mercados de especialidad. Orgánico (USDA/UE), Rainforest Alliance (sostenibilidad integral), Comercio Justo (precio mínimo), Bird Friendly ( Smithsonian).', 'sostenibilidad', '🏆', 'Rainforest Alliance'),
    ('Cómo Calcular tu Costo de Producción', 'Aprende a calcular el costo real por quintal.', 'Conocer tu costo de producción es esencial para negociar precios. Incluye: mano de obra (60-70%), fertilizantes (15-20%), fungicidas (5-8%), transporte y otros.', 'comercializacion', '💰', 'IHCAFE'),
    ('La Roya del Café: Prevención y Control', 'Identifica, prevé y controla la roya.', 'La roya (Hemileia vastatrix) es la enfermedad más devastadora del café. Prevención: variedades resistentes, buena nutrición, sombra adecuada. Control: fungicidas preventivos y monitoreo constante.', 'sostenibilidad', '🍂', 'IHCAFE'),
    ('Métodos de Preparación: V60', 'Domina el V60 y resalta las notas de tu café.', 'Hario V60: 20g café/320g agua, 90-96°C, tiempo 2:30-3:00 min, molienda media. Técnica: verter en círculos concéntricos.', 'metodos_preparacion', '🍶', 'Barista Hustle'),
    ('Compostaje para Fincas Cafetaleras', 'Transforma desechos del beneficio en abono.', 'La pulpa de café puede convertirse en compost de alta calidad. Proporción: 3 partes de pulpa por 1 de material seco. Tiempo: 60-90 días.', 'sostenibilidad', '♻️', 'CATIE');
