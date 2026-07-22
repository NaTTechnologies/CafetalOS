# Historial de cambios

El proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

## [2.6.0] — 2026-07-21

### Añadido

- Integración REST con Open-Meteo desde el proceso Main de Electron.
- Geolocalización del dispositivo y búsqueda manual con Open-Meteo Geocoding.
- Pronóstico de siete días, presión superficial, sensación térmica, lluvia y viento.
- Caché local de 30 minutos y recuperación offline de la última lectura.
- Diagnóstico ambiental de extracción con reglas de humedad del ERS.
- Persistencia ampliada de lecturas meteorológicas y caché demo íntegra.

### Corregido

- Error `loteId is not defined` al abrir la planilla semanal de cortadores.
- Contrato IPC y prueba de regresión de la consulta semanal.

## [2.5.0] — 2026-07-21

### Añadido

- Módulo de ventas de café con validación de inventario, cliente, factura, destino y anulación controlada.
- Kardex cronológico con saldos por producto y origen.
- Alertas de permanencia, humedad y rotación de café almacenado.
- DevTools mediante F12, menú Ver e inspección por clic derecho.
- Demo íntegra con ventas vinculadas a movimientos de inventario.

### Corregido

- Interfaz de pegado desde Excel en registro masivo.
- Apertura, carga y validación de la planilla semanal.
- Errores ESLint que bloqueaban la compilación y publicación de la release.

## [2.4.1] — 2026-07-21

### Añadido

- Panel de control experto con filtros por ventana analítica, año financiero e indicador de cosecha.
- Nuevos gráficos operativos para costos del período, composición del inventario y rendimiento de lotes en beneficio.
- Lectura ejecutiva con alertas, compras, trazabilidad e insights de rendimiento.

### Cambiado

- Se ajustó la experiencia visual del resumen para ofrecer más controles y más profundidad analítica sin perder la hero principal.
- Los encabezados de módulos legacy ahora separan correctamente los botones y acciones masivas, evitando que queden pegados en desktop y móvil.
- La interfaz responsive del dashboard se adaptó para conservar la legibilidad de KPIs, gráficos e insights en pantallas pequeñas.

## [2.4.0] — 2026-07-21

### Añadido

- Planilla semanal de corte con una fila por cortador, columnas por día y fecha, totales de unidad, kilos y pago.
- Temporadas de café con unidad, precio, peso de referencia y cantidad de días predeterminados.
- Seguimiento operativo de costo, transformación y margen estimado por semana/lote.
- Registro masivo para lotes, cortadores, cosecha, beneficio, inventario, gastos, proveedores, compras, clima y calidad.
- Pegado tabulado desde Excel con resolución de listas, validación por fila y guardado atómico.
- Módulo Compras de café para proveedores, recepción por peso, control de calidad, inventario y envío a beneficio.
- Soporte de café cereza, pergamino húmedo, pergamino seco, verde y tostado.
- Perfil operativo Productor, Comprador/beneficiador o Mixto.
- Centro de educación con rutas, progreso, evaluaciones y estado por usuario.
- Ayuda responsive y nuevas capturas Playwright de planillas, compras y matrices.
- Dos tools MCP de lectura: `cafetal_planillas_corte` y `cafetal_resumen_compras`.
- Resource MCP `cafetal://operacion/acopio`.
- Documentación específica de planillas, registros masivos, acopio y educación interactiva.

### Cambiado

- Las compras aprobadas o condicionadas pueden crear inventario y conservar costo de origen.
- Beneficio e inventario distinguen origen propio y comprado.
- Los KPI y listados de finca excluyen el lote técnico de acopio.
- La configuración institucional incorpora plantillas rápidas y parámetros operativos.
- La demo incluye temporadas, planillas, proveedores, compras y progreso educativo.

### Seguridad e integridad

- Operaciones masivas usan transacción y rollback completo.
- Se rechazan códigos duplicados, relaciones inactivas y saldos de inventario proyectados negativos.
- La política de calidad puede exigir humedad y defectos antes de aprobar compras.
- Una compra no puede enviarse dos veces a beneficio ni rechazarse después de crear inventario sin una reversión explícita.

## [2.3.0] — 2026-07-21

### Añadido

- Servidor local Model Context Protocol por transporte `stdio`, integrado al ejecutable de Cafetal OS.
- Doce tools cafetaleras de consulta, tres resources y tres prompts para clientes de inteligencia artificial.
- Tres tools de escritura opcionales, ocultas por defecto y habilitadas únicamente con `--write`.
- Panel **Configuración → IA local (MCP)** para generar la configuración del cliente sin editar comandos manualmente.
- Validaciones de dominio en el proceso principal y asistencia contextual en formularios de finca, lotes, cosecha, beneficio, inventario, gastos, calidad, clima, sostenibilidad, certificaciones, alertas, clientes, campañas, fidelización y mercado.
- Reglas de consistencia para lotes activos, capacidad de área, referencias y existencias disponibles.
- Panel **Reportes y membrete** con identidad institucional, logotipo, colores, responsable y pie configurables.
- Nuevo generador PDF con encabezado profesional, metadatos, numeración y diseño multipágina.
- Documentación y pruebas específicas para MCP, validaciones inteligentes y reportes.
- Capturas Playwright de las nuevas secciones de configuración.

### Seguridad

- MCP opera en solo lectura por defecto y no expone SQL arbitrario ni credenciales.
- Los esquemas de entrada de tools están cerrados y se validan en ejecución; argumentos adicionales, tipos incorrectos y valores fuera de rango se rechazan. La escritura requiere activación explícita.
- La configuración institucional solo puede ser modificada por administradores autenticados.

### Cambiado

- El bundle principal ahora verifica que autenticación, MCP y validaciones de dominio queden integrados.
- La guía de contribución incorpora criterios para tools, formularios asistidos y reportes profesionales.

## [2.2.2] — 2026-07-21

### Corregido

- El fondo de cierre del drawer móvil comienza después del ancho real del sidebar, evitando que los enlaces del menú intercepten el clic de Playwright.
- La automatización de capturas mide el sidebar y el fondo antes de cerrar el menú, y falla con un diagnóstico explícito si sus áreas se superponen.
- Las pruebas E2E de navegación móvil reutilizan el mismo cierre seguro y verifican que la clase `mobile-menu-open` desaparezca.
- Se añadió una prueba unitaria de regresión para el área interactiva del drawer móvil.

## [2.2.1] — 2026-07-21

### Corregido

- Se eliminó la ambigüedad accesible entre el campo `Contraseña` y el botón `Mostrar contraseña`.
- Los campos de acceso ahora utilizan etiquetas HTML explícitas con `for` e `id`; el botón de visibilidad ya no está anidado dentro de un elemento `<label>`.
- Las pruebas E2E y de capturas usan coincidencia exacta para `Usuario` y `Contraseña`.
- Se añadió una prueba unitaria de regresión para impedir que vuelva a existir más de un control asociado a la etiqueta de contraseña.

## [2.2.0] — 2026-07-21

### Cambiado

- El proyecto adopta oficialmente el nombre **Cafetal OS** en la aplicación, paquetes, bases, instaladores y documentación.
- Se integró la nueva identidad visual basada en hojas, cerezas de café y circuitos.
- La interfaz se adapta progresivamente a ventanas de escritorio, tablet y móvil.
- El sidebar se transforma en drawer móvil y las tablas operativas pasan a tarjetas en pantallas pequeñas.

### Añadido

- Galerías separadas `IMG/desktop` y `IMG/mobile`.
- Documentación de desarrollo, identidad visual, arquitectura responsive y evolución hacia PWA/Android/iOS.
- Archivos de comunidad: gobernanza, soporte, comunidad y citación.
- Verificación previa de Electron y del bundle antes de ejecutar Playwright.
- Diagnóstico de `stdout` y `stderr` cuando Electron termina antes de crear una ventana.
- Limpieza determinista de `out`, resultados y perfiles temporales antes de compilar o capturar.
- Alias `npm run capturas` y modo `npm run screenshots:debug`.

### Corregido

- El flujo de capturas ya no depende de un `playwright` global ni de `npx run`.
- Se evita reutilizar un bundle antiguo que contenga `require('./auth-store')`.
- El script de capturas valida `electron/path.txt`, el ejecutable y las entradas compiladas.
- El workflow de releases utiliza el nombre `cafetal-os` para sus artefactos.
- Se preservan las capturas históricas en `IMG/referencias` para que la regeneración no rompa el README.
- Se actualizaron Vite y dependencias transitivas; `npm audit` queda sin vulnerabilidades conocidas.

## [2.1.1] — 2026-07-21

### Corregido

- El proceso principal ahora integra `AuthStore` dentro de `out/main/index.js` durante la compilación.
- Se eliminó el `require('./auth-store')` no resuelto que impedía iniciar Electron en desarrollo y producción.
- La prueba unitaria de autenticación usa la misma importación ESM que la compilación real.
- La compilación verifica automáticamente que no queden módulos locales sin resolver en el bundle principal.

## [2.1.0] — 2026-07-21

### Añadido

- Inicio de sesión local con cuenta inicial `admin` / `admin`.
- Usuarios múltiples con roles Administrador y Usuario.
- Contraseñas derivadas mediante `crypto.scrypt`, sal individual y comparación segura.
- Panel Vue 3 de Configuración con datos, cuenta, usuarios y documentación.
- Cambio interno entre base productiva y demo, sin depender de un script externo.
- Restauración de la demostración y acceso directo al respaldo manual.
- Búsqueda funcional de módulos con `Ctrl/Cmd + K`, teclado y roles ARIA.
- Colapso independiente de los grupos del menú y persistencia de preferencias.
- Automatización Playwright para capturar todas las interfaces en `IMG/`.
- Documentación específica de autenticación, configuración, navegación y galería visual.

### Corregido

- Scroll interno permanente del menú lateral en todos los módulos.
- Scroll independiente del panel central, incluyendo Beneficio y tablas largas.
- Conflicto del antiguo `.page-body` heredado con el contenedor Vue.
- Instaladores de desarrollo para Electron 42+ mediante `install-electron`.

### Seguridad

- Todos los canales IPC de datos pasan por `secureHandle` y exigen una sesión vinculada a la ventana.
- El almacén de usuarios se mantiene separado de las bases productiva y demo.
- Protección contra desactivar o degradar al último administrador activo.

## [2.0.0] — 2026-07-20

### Añadido

- Shell de escritorio en Vue 3 y Electron Vite.
- Sistema visual renovado, dashboard productivo y navegación agrupada.
- Modo demo aislado con más de 2,800 registros sintéticos.
- Datos demostrativos para sostenibilidad, calidad, trazabilidad, marketing, clima y alertas.
- Vitest, Vue Test Utils y pruebas E2E de Electron con Playwright.
- Compilaciones Windows, macOS y Linux mediante electron-builder y GitHub Actions.
- Manuales de usuario, arquitectura, pruebas, distribución, contribución y seguridad.

### Cambiado

- La base de producción se ejecuta desde el directorio seguro `userData` de Electron.
- El renderer ya no recibe acceso directo a Node.js.
- El dashboard calcula inventario a partir de movimientos reales.
- Los módulos JavaScript originales se encapsulan como adaptadores durante su migración progresiva a Vue.

### Seguridad

- `contextIsolation`, sandbox y `webSecurity` habilitados.
- Bloqueo de navegación no autorizada y apertura externa solo de HTTPS.
- Contrato IPC explícito sin un canal genérico expuesto al renderer.
