# Investigación técnica y benchmark funcional

Fecha de revisión: 20 de julio de 2026.

## Decisiones tecnológicas

### Vue 3 + Vite

Vue recomienda `create-vue` y una cadena basada en Vite para nuevos proyectos. La migración usa componentes SFC para la interfaz moderna y conserva temporalmente adaptadores para los módulos existentes. Esto reduce el riesgo de una reescritura simultánea de más de ocho mil líneas de lógica de interfaz.

### Electron Vite + electron-builder

`electron-vite` centraliza la compilación de main, preload y renderer. `electron-builder` produce instaladores nativos y permite una matriz de compilación en GitHub Actions. La construcción de macOS debe ejecutarse en macOS para obtener artefactos confiables y firmables.

### Vitest + Vue Test Utils + Playwright

Vitest comparte la configuración de Vite y Vue Test Utils permite probar componentes Vue 3. Playwright dispone de soporte experimental para controlar una aplicación Electron y se usa como prueba de humo del binario compilado.

### Seguridad Electron

Se aplican las recomendaciones principales de Electron: aislamiento de contexto, sandbox, renderer sin Node.js, navegación controlada y una API mínima en preload. El proyecto no expone un `invoke(channel)` genérico.

## Benchmark del sector

### farmOS

Su enfoque open source demuestra el valor de un modelo extensible, registros de campo, control del productor sobre sus datos y capacidad de planificación. Para Cafetal OS esto respalda un futuro sistema de plugins, mapas y calendarios de labores.

### Cropster Origin

Las funciones públicas de Cropster enfatizan inventario, muestras, calidad, trazabilidad y reportes listos para auditoría. Cafetal OS ya cubre esos dominios en una escala local; debe profundizar trazabilidad volumétrica, gestión de muestras y costos por proceso.

### IHCAFE

El contexto hondureño requiere productividad, competitividad, sostenibilidad, formación y atención a riesgos como roya y broca. La aplicación mantiene español claro, unidades locales, operación sin conexión y un módulo educativo.

## Brechas y oportunidades priorizadas

1. Migrar Finca, Lotes y Cosecha a Vue nativo con servicios de dominio testeables.
2. Incorporar polígonos GeoJSON, mapas y cálculo de superficie.
3. Crear calendario de labores con alertas y bitácora por lote.
4. Implementar trazabilidad volumétrica: cosecha → beneficio → inventario → venta.
5. Administrar muestras, contratos y documentos de certificación.
6. Añadir importación/exportación CSV y API de plugins.
7. Mantener sincronización opcional; la experiencia principal debe seguir funcionando offline.

## Fuentes primarias consultadas

- Vue: https://vuejs.org/guide/quick-start.html
- Vue Tooling: https://vuejs.org/guide/scaling-up/tooling.html
- electron-vite: https://electron-vite.org/guide/
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
- electron-builder: https://www.electron.build/
- Vitest: https://vitest.dev/guide/
- Vue Test Utils: https://test-utils.vuejs.org/
- Playwright Electron: https://playwright.dev/docs/api/class-electron
- farmOS: https://farmos.org/
- Cropster Origin: https://www.cropster.com/products/origin/
- IHCAFE: https://www.ihcafe.hn/

## Investigación aplicada a Cafetal OS 2.4.0

### Corte y cuadrillas

La captura semanal se diseñó alrededor del trabajo manual selectivo: una misma cuadrilla puede realizar varios pases y registrar cantidades distintas por persona/día. Por eso la matriz conserva el nombre del cortador, el día, la fecha, la unidad operativa, el peso de referencia y el pago.

### Compras por peso

La ruta de acopio registra las transacciones comerciales por kg y su equivalencia a qq. La lata o canasta se conserva únicamente como unidad operativa de corte. Esta separación evita usar el recipiente de campo como unidad comercial y permite comparar proveedores y rendimientos.

### Trazabilidad de recepción

Una compra conserva proveedor, finca/origen, lote del proveedor, comprobante, producto, cantidad, calidad, inventario y transformación. El diseño sigue el principio de reconocer el paso anterior y el paso siguiente de la cadena.

### Calidad y rendimiento

Humedad, defectos y rendimiento de transformación se registran como información operativa. El sistema permite condicionar una recepción y evita presentar un rango orientativo como certificación automática.

### Fuentes adicionales

- IHCAFE, comercialización: https://ihcafe.hn/comercializacion-de-cafe/
- SCA, Coffee Standards: https://sca.coffee/research/coffee-standards
- UNIDO, Traceability in the Green Coffee Supply Chain: https://www.unido.org/publications/ot/9654750/pdf
- CNPML Honduras, guía para beneficios de café: https://www.cnpml-honduras.org/wp-content/uploads/2018/02/Guia_de_P_mas_L__para_beneficios_de_cafe.pdf
- TechnoServe, Coffee Wet Mill Processing Guide: https://www.technoserve.org/wp-content/uploads/2014/02/coffee-wet-mill-processing-guide.pdf
