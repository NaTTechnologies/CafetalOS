# Historial de cambios

El proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

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
