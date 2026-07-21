# Roadmap de Cafetal OS

El roadmap prioriza valor para la finca, seguridad de los datos y una migración técnica sostenible. Las fechas dependen de la participación comunitaria y no constituyen compromisos contractuales.

## Versión 2.2 — Base comunitaria y responsive

Estado: implementada.

- Identidad Cafetal OS.
- Login local y múltiples usuarios.
- Configuración y cambio interno de demo.
- Sidebar con scroll, grupos y colapso.
- Búsqueda de módulos.
- Interfaz responsive desktop/móvil.
- Galería Playwright desktop y móvil.
- Documentación de comunidad y contribución.

## Versión 2.3 — Dominio Vue y productividad

- Migrar Finca, Lotes y Cosecha a componentes Vue nativos.
- Separar handlers IPC por dominio.
- Validaciones compartidas entre interfaz y proceso principal.
- Auditoría de cambios y papelera antes de eliminar.
- Importación y exportación CSV con validación previa.
- Calendario de labores y recordatorios locales.
- Adjuntos de fotografías y comprobantes.

## Versión 2.4 — Café especial y trazabilidad

- Protocolos de catación configurables.
- Comparación histórica de cataciones.
- Trazabilidad volumétrica desde cereza hasta venta.
- Costos por lote, quintal y proceso.
- Documentos de certificación y vencimientos.
- Polígonos GeoJSON y cálculo de superficie.

## Versión 2.5 — Preparación web y móvil

- Extraer repositorios y casos de uso independientes de Electron.
- Adaptador de almacenamiento web.
- Manifiesto PWA y Service Worker experimental.
- Instalación y operación offline en navegador.
- Diseño táctil y pruebas en tablet/teléfono.
- Evaluación de Capacitor para Android e iOS.

## Versión 3.0 — Ecosistema opcional

- Múltiples fincas por instalación.
- Sincronización cifrada y opcional entre dispositivos.
- Resolución de conflictos offline.
- API documentada.
- Sistema de plugins con permisos explícitos.
- Catálogo de extensiones comunitarias.
- Internacionalización regional.

## Criterios para priorizar

Una propuesta recibe mayor prioridad cuando:

1. resuelve un problema real validado por productores;
2. funciona offline o degrada correctamente sin internet;
3. evita duplicidad de registros;
4. mejora trazabilidad, costos o calidad;
5. puede probarse automáticamente;
6. no compromete privacidad ni seguridad;
7. es mantenible por una comunidad pequeña.
