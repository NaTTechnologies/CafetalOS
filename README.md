<p align="center">
  <img src="branding/cafetal-os-app-icon.png" width="180" alt="Logo de Cafetal OS" />
</p>

<h1 align="center">Cafetal OS</h1>

<p align="center">
  Sistema open source, offline-first y multiplataforma para administrar fincas cafetaleras desde el lote hasta la taza.
</p>

<p align="center">
  <strong>Vue 3 · Electron · SQL.js · Vitest · Playwright · MIT</strong>
</p>

## Propósito

Cafetal OS busca convertir la gestión diaria de una finca cafetalera en información útil y trazable. Está pensado para productores, administradores de finca, técnicos agrícolas, organizaciones de café y desarrolladores que quieran construir tecnología abierta para el sector.

La aplicación funciona localmente, no requiere conexión permanente a internet y mantiene separadas la base productiva y la base demostrativa.

## Vista general

<table>
  <tr>
    <td width="50%"><img src="IMG/referencias/lotes-v2.0.png" alt="Módulo de lotes" /></td>
    <td width="50%"><img src="IMG/referencias/beneficio-v2.0.png" alt="Módulo de beneficio" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Lotes y parcelas</strong></td>
    <td align="center"><strong>Beneficio y procesamiento</strong></td>
  </tr>
</table>

Estas imágenes son referencias del rediseño que originó la interfaz actual. La galería reproducible de cada versión se genera en `IMG/desktop/` y `IMG/mobile/` mediante Playwright.

## Funciones principales

- Finca, lotes, variedades y certificaciones.
- Cosecha, recolectores y costos por corte.
- Beneficio húmedo/seco, humedad y rendimiento.
- Inventario, movimientos, gastos y reportes.
- Calidad y catación, trazabilidad y sostenibilidad.
- Clima, alertas fitosanitarias, mercado y análisis predictivo.
- Clientes, campañas, perfiles de café y contenido educativo.
- Inicio de sesión local, múltiples usuarios y roles.
- Base demo restaurable desde la propia aplicación.
- Respaldos locales y exportaciones.
- Interfaz desktop y responsive con drawer móvil y tablas adaptativas.

## Inicio rápido en Windows

Requisitos:

- Windows 10 u 11.
- Node.js 22.12 o superior.
- Conexión a internet durante la primera instalación de dependencias y Electron.

Pasos:

1. Descomprima el repositorio en una carpeta nueva.
2. Ejecute `instalar.bat`.
3. Ejecute `desarrollar.bat`.
4. Inicie sesión con `admin` / `admin`.
5. Cambie la contraseña en **Configuración → Mi cuenta**.
6. Cargue la demostración desde **Configuración → Datos y demo**.

> No mezcle versiones nuevas sobre carpetas antiguas. Cada entrega debe descomprimirse en su propia carpeta para evitar módulos compilados obsoletos.

## Inicio desde terminal

```bash
npm ci
npx install-electron --no
npm run dev
```

Para abrir una demo regenerada:

```bash
npm run demo:reset
```

## Comandos del proyecto

| Comando | Resultado |
|---|---|
| `npm run dev` | Ejecuta Vue y Electron con recarga en caliente. |
| `npm run demo:reset` | Regenera y abre la base demo. |
| `npm run demo:generate` | Genera `database/cafetal-os-demo.db`. |
| `npm run db:template` | Regenera la plantilla productiva vacía. |
| `npm test` | Ejecuta pruebas unitarias y de componentes. |
| `npm run test:coverage` | Genera cobertura de Vitest. |
| `npm run test:e2e` | Ejecuta pruebas de humo sobre Electron. |
| `npm run screenshots` | Genera galerías desktop y móvil en `IMG/`. |
| `npm run lint` | Valida JavaScript y Vue con ESLint. |
| `npm run verify` | Comprueba que la entrega tenga sus archivos esenciales. |
| `npm run security:audit` | Audita las dependencias con npm. |
| `npm run build:app` | Compila main, preload y renderer sin crear instalador. |
| `npm run build:win` | Genera NSIS y portable para Windows. |
| `npm run build:mac` | Genera DMG y ZIP; debe ejecutarse en macOS. |
| `npm run build:linux` | Genera AppImage y DEB en Linux. |

## Capturas automatizadas

En Windows puede ejecutar:

```bat
capturar-pantallas.bat
```

O desde cualquier terminal:

```bash
npm run screenshots
```

El proceso:

1. regenera la demo;
2. compila la aplicación;
3. inicia Electron desde la raíz del proyecto;
4. entra con `admin` / `admin`;
5. recorre todos los módulos;
6. genera capturas desktop de 1600 × 1000;
7. genera capturas móviles de 430 × 900;
8. guarda diagnóstico de Playwright si Electron termina antes de abrir la ventana.

No use:

```bash
npx run screenshots
```

`npx run` puede descargar y ejecutar un paquete diferente llamado `run`, lo que produce mensajes como `Watching...`, `Starting: screenshots` y `Cannot find module .../screenshots`. El comando correcto es **`npm run screenshots`**.

Consulte [Capturas con Playwright](docs/CAPTURAS_PLAYWRIGHT.md) y [Galería de interfaces](IMG/README.md).

## Diseño responsive

La ventana de Electron puede reducirse hasta 360 píxeles de ancho. En pantallas pequeñas:

- el sidebar se convierte en un drawer lateral;
- el buscador se abre como una capa móvil;
- el contenido mantiene scroll independiente;
- las tablas operativas se transforman en tarjetas con etiquetas;
- formularios, paneles y botones se apilan progresivamente;
- se respetan áreas seguras y preferencias de movimiento reducido.

Esta base facilita una futura evolución hacia PWA, Android e iOS, pero la versión actual sigue siendo una aplicación Electron. Consulte [Arquitectura responsive y evolución móvil](docs/RESPONSIVE_Y_MOVIL.md).

## Arquitectura

```text
src/main/                    proceso principal, base local, autenticación e IPC
src/preload/                 contrato seguro expuesto a Vue
src/renderer/src/            shell y componentes Vue 3
src/renderer/public/legacy/  módulos heredados encapsulados durante la migración
database/                    esquema, semillas y bases plantilla
scripts/                     instalación, demo, validación, capturas y builds
tests/unit/                  Vitest y Vue Test Utils
tests/e2e/                   Playwright Electron
IMG/                         galería desktop/móvil y documentación visual
docs/                        manuales funcionales y técnicos
branding/                    originales y derivados de identidad visual
```

La migración usa un patrón incremental: la navegación, autenticación, dashboard, configuración y sistema visual son Vue 3; los módulos operativos heredados siguen encapsulados hasta ser convertidos individualmente.

## Datos y privacidad

- Producción: `cafetal-os.db` dentro de `userData` de Electron.
- Demo: `cafetal-os-demo-runtime.db`, separada de producción.
- Plantillas del repositorio: `database/cafetal-os.db` y `database/cafetal-os-demo.db`.
- Usuarios: `security/users.json`, con contraseñas derivadas mediante `scrypt` y salt individual.
- Respaldos: `Documentos/CafetalOS/Respaldos/`.
- No se envían datos a servicios externos por defecto.

La versión 2.2 migra automáticamente nombres de base locales utilizados por versiones anteriores cuando se encuentran en el mismo directorio de usuario.

## Cómo participar

No es necesario ser programador. La comunidad necesita distintos perfiles:

- **Cafetaleros:** validar flujos, términos, unidades y necesidades reales.
- **Técnicos y agrónomos:** revisar cálculos, alertas y prácticas agrícolas.
- **Catadores y compradores:** fortalecer calidad, perfiles y trazabilidad.
- **Diseñadores:** mejorar accesibilidad y experiencia en campo.
- **Desarrolladores:** migrar módulos a Vue, corregir errores y ampliar pruebas.
- **Documentadores y formadores:** crear manuales, videos y material educativo.

Lea [CONTRIBUTING.md](CONTRIBUTING.md), [GOVERNANCE.md](GOVERNANCE.md) y [COMMUNITY.md](COMMUNITY.md) antes de enviar una contribución.

## Documentación

### Para usuarios

- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Catálogo de módulos](docs/MODULOS.md)
- [Configuración y demo](docs/CONFIGURACION_Y_DEMO.md)
- [Autenticación y usuarios](docs/AUTENTICACION_USUARIOS.md)
- [Galería de interfaces](IMG/README.md)

### Para colaboradores técnicos

- [Guía de desarrollo](docs/DESARROLLO.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Modelo de datos](docs/MODELO_DATOS.md)
- [Contrato IPC](docs/API_IPC.md)
- [Migración a Vue](docs/MIGRACION_VUE.md)
- [Pruebas](docs/TESTING.md)
- [Capturas con Playwright](docs/CAPTURAS_PLAYWRIGHT.md)
- [Responsive y evolución móvil](docs/RESPONSIVE_Y_MOVIL.md)
- [Identidad visual](docs/IDENTIDAD_VISUAL.md)
- [Compilación y distribución](docs/BUILD.md)
- [Seguridad](SECURITY.md)

### Para la comunidad

- [Cómo contribuir](CONTRIBUTING.md)
- [Gobernanza](GOVERNANCE.md)
- [Comunidad](COMMUNITY.md)
- [Soporte](SUPPORT.md)
- [Código de conducta](CODE_OF_CONDUCT.md)
- [Roadmap](docs/ROADMAP.md)
- [Historial de cambios](CHANGELOG.md)
- [Cómo citar el proyecto](CITATION.cff)
- [Decisiones de arquitectura](docs/decisions/README.md)

## Estado del proyecto

Cafetal OS está en desarrollo activo. Antes de utilizarlo como única fuente de información productiva, tributaria, comercial o de certificación, valide los reportes y mantenga respaldos independientes.

## Licencia y marca

El código se distribuye bajo licencia MIT. El nombre **Cafetal OS**, su identidad visual y el logo suministrado deben tratarse conforme a [docs/IDENTIDAD_VISUAL.md](docs/IDENTIDAD_VISUAL.md). La licencia del código no concede derechos sobre datos, certificaciones o contenido de terceros.
