# Guía de desarrollo de Cafetal OS

Esta guía está dirigida a personas que desean ejecutar, comprender o modificar Cafetal OS. El proyecto combina Electron, Vue 3, SQL.js y módulos heredados que se migran de forma incremental.

## Requisitos

- Node.js 22.12 o superior. Para desarrollo estable se recomienda Node.js 22 LTS.
- npm 10 o superior.
- Git.
- Windows 10/11, macOS o una distribución Linux compatible con Electron.
- Conexión a internet durante la primera instalación y descarga del ejecutable de Electron.

Compruebe el entorno:

```bash
node --version
npm --version
git --version
```

## Preparar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd cafetal-os
npm ci
npx install-electron --no
npm run verify
```

En Windows también puede ejecutar `instalar.bat`.

## Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación inicia el proceso principal, el preload y el servidor Vite del renderer. Los cambios de Vue se recargan automáticamente. Los cambios del proceso principal pueden reiniciar Electron.

Para abrir una base demo nueva:

```bash
npm run demo:reset
```

Credenciales iniciales:

```text
usuario: admin
contraseña: admin
```

## Estructura del código

```text
src/main/                    Electron, persistencia, seguridad e IPC
src/preload/                 API segura expuesta a la interfaz
src/renderer/src/            componentes y vistas Vue 3
src/renderer/public/legacy/  módulos funcionales aún no migrados
scripts/                     automatización multiplataforma
database/                    esquema y bases plantilla
tests/unit/                  Vitest y Vue Test Utils
tests/e2e/                   Playwright para Electron
docs/                        documentación funcional y técnica
IMG/                         galería reproducible de interfaces
branding/                    identidad visual
```

## Flujo recomendado de trabajo

1. Cree una rama desde la rama principal.
2. Reproduzca el problema con la base demo.
3. Mantenga el cambio limitado a un objetivo verificable.
4. Agregue o actualice pruebas.
5. Ejecute validaciones locales.
6. Actualice documentación y capturas cuando cambie la interfaz.
7. Abra un pull request con evidencia.

Ejemplo:

```bash
git checkout -b fix/scroll-beneficio
npm test
npm run lint
npm run verify
npm run build:app
```

## Convenciones de implementación

### Vue

- Use Composition API y `<script setup>` para componentes nuevos.
- Mantenga componentes pequeños y con responsabilidades claras.
- Use propiedades y eventos explícitos; evite modificar estado global desde componentes secundarios.
- Incluya nombres accesibles en controles interactivos.
- No introduzca dependencias cuando una solución pequeña con Vue o APIs del navegador sea suficiente.

### Electron e IPC

- El renderer no debe acceder directamente a Node.js.
- Toda operación privilegiada debe pasar por `src/preload/index.js` y un canal IPC fijo.
- No exponga `ipcRenderer.send`, `invoke` o canales arbitrarios al renderer.
- Valide permisos y sesión en el proceso principal.
- Mantenga `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true`.

### Base de datos

- Nunca modifique una base real para desarrollar o probar.
- Actualice primero `database/schema.sql`.
- Haga que las migraciones sean repetibles e idempotentes.
- Actualice el generador demo si la nueva función requiere datos.
- Regenerar plantillas:

```bash
npm run db:template
npm run demo:generate
```

### Módulos heredados

Los archivos de `src/renderer/public/legacy/` conservan funcionalidad mientras se completa la migración. Una corrección puntual puede realizarse allí, pero las funciones nuevas deberían diseñarse como componentes y servicios Vue cuando sea razonable.

Consulte `docs/MIGRACION_VUE.md` antes de migrar un módulo completo.

## Pruebas

```bash
npm test
npm run test:coverage
npm run test:e2e
npm run screenshots
```

- **Vitest:** dominio, formateadores, navegación, autenticación y contratos.
- **Vue Test Utils:** comportamiento de componentes.
- **Playwright Electron:** arranque, navegación, scroll, responsive y capturas.

Las pruebas E2E requieren que el ejecutable de Electron esté instalado. En equipos Linux sin sesión gráfica puede utilizarse `xvfb-run`.

## Depuración del proceso principal

Ejecute:

```bash
npm run dev -- --trace-warnings
```

Para problemas de capturas:

```bash
npm run screenshots:debug
```

Revise:

```text
test-results/
playwright-report/
.tmp/
```

La utilidad `tests/e2e/helpers/electron-app.js` captura la salida estándar y los errores del proceso Electron. Si la aplicación termina antes de crear una ventana, el error debe incluir el diagnóstico del proceso principal.

## Validación antes de un pull request

```bash
npm test
npm run lint
npm run verify
npm run build:app
```

Cuando hay cambios visuales:

```bash
npm run screenshots
```

No confirme `node_modules/`, `out/`, `dist/`, bases runtime, credenciales, respaldos ni datos personales.

## Desarrollar planillas o cargas masivas

Revise conjuntamente:

- `src/renderer/public/legacy/registro-masivo.js`;
- `src/main/domain-validation.js`;
- `src/main/index.js`;
- `src/preload/index.js`;
- `tests/unit/bulk-workflows.spec.js`;
- `tests/e2e/screenshots.spec.js`.

No agregue una columna visual sin normalización y validación equivalente en el proceso principal. Para campos relacionados use listas explícitas; no acepte identificadores escritos libremente cuando el usuario puede elegir una entidad activa.

## Desarrollar compras y acopio

El módulo está en `src/renderer/public/legacy/compras.js`. Una recepción puede generar inventario o beneficio, por lo que cualquier cambio debe comprobar efectos laterales y evitar duplicados.

Flujo mínimo de prueba:

1. crear proveedor;
2. registrar compra pendiente;
3. completar calidad;
4. aprobar y verificar inventario;
5. enviar una compra húmeda a beneficio;
6. confirmar que el segundo envío se rechaza.

## Desarrollar contenido educativo

El contenido y el progreso deben permanecer separados. Las lecciones pueden crecer sin cambiar el modelo de autenticación. Una contribución de contenido debe indicar audiencia, objetivo, fuente, lista práctica y evaluación.
