# Capturas automatizadas con Playwright

Cafetal OS genera una galería reproducible de la aplicación Electron real usando la base demo. La automatización no sustituye el preload ni simula la base de datos: inicia el bundle compilado, autentica un usuario y recorre los módulos por la misma interfaz pública que utiliza la aplicación.

## Comandos

```bash
npm run screenshots
```

Alias en español:

```bash
npm run capturas
```

En Windows:

```bat
capturar-pantallas.bat
```

Para abrir Playwright en modo de depuración:

```bash
npm run screenshots:debug
```

## Flujo automatizado

1. Regenera `database/cafetal-os-demo.db`.
2. Compila main, preload y renderer.
3. Verifica que `AuthStore` esté integrado en `out/main/index.js`.
4. Verifica `node_modules/electron/path.txt` y el ejecutable real de Electron.
5. Elimina el perfil temporal de capturas.
6. Inicia Electron desde la raíz del proyecto con `--demo --reset-demo`.
7. Captura el inicio de sesión.
8. Inicia sesión con `admin` / `admin`.
9. Recorre los módulos y las pestañas de Configuración.
10. Repite la galería en tamaño móvil.
11. Cierra Electron y conserva trazas cuando ocurre un error.

## Salidas

```text
IMG/desktop/  capturas de 1600 × 1000
IMG/mobile/   capturas de 430 × 900
```

Las imágenes representan el viewport completo de la aplicación. El contenido de cada módulo comienza desde la parte superior. En pantallas móviles, las tablas se representan como tarjetas cuando corresponde.

## Por qué ocurría `firstWindow: Timeout 30000ms`

`electronApplication.firstWindow()` espera que el proceso principal cree una `BrowserWindow`. Si el proceso principal termina antes —por ejemplo, porque el bundle conserva un `require('./auth-store')` hacia un archivo que no fue generado— Playwright solo observa que nunca apareció una ventana y finalmente informa un timeout.

La versión 2.2 corrige este diagnóstico de tres maneras:

- `scripts/verify-bundle.js` impide compilar un bundle con el módulo de autenticación faltante;
- `scripts/check-electron.js` valida el ejecutable y las entradas compiladas antes de iniciar Playwright;
- `tests/e2e/helpers/electron-app.js` compite entre la primera ventana y la terminación del proceso, adjuntando `stdout` y `stderr` al error.

Ahora, si Electron termina antes de abrir la ventana, el mensaje debe mostrar la causa del proceso principal en vez de limitarse a un timeout genérico.

## Diferencia entre `npm` y `npx`

El comando correcto es:

```bash
npm run screenshots
```

No use:

```bash
npx run screenshots
```

`npx run` puede ejecutar un paquete distinto llamado `run`. Eso produce salidas como:

```text
Watching ...
Starting: screenshots
Cannot find module .../screenshots
```

Tampoco use `node screenshots`, porque `screenshots` es un script de npm, no un archivo JavaScript.

## Diagnóstico en Windows

Compruebe Electron:

```bat
node scripts\check-electron.js
```

Si falta el ejecutable:

```bat
npx install-electron --no
```

Limpieza recomendada cuando se mezclaron versiones:

```bat
rmdir /s /q node_modules
rmdir /s /q out
rmdir /s /q test-results
rmdir /s /q playwright-report
npm ci
npx install-electron --no
npm run screenshots
```

Descomprima cada versión en una carpeta nueva. No copie una versión reciente encima de una carpeta `AppCafeHonduras-Vue3-2.0.0`, porque pueden quedar bundles o dependencias antiguas.

## Archivos de diagnóstico

```text
test-results/
playwright-report/
.tmp/screenshots-user-data/
```

Cuando reporte un problema, incluya:

- sistema operativo;
- `node --version`;
- `npm --version`;
- salida completa de `node scripts/check-electron.js`;
- salida completa de `npm run screenshots`;
- `error-context.md` y la traza generada.

## Integración con documentación

`IMG/README.md` describe cada pantalla. Un pull request que cambie de forma deliberada la interfaz debe regenerar la galería y confirmar las imágenes modificadas.
