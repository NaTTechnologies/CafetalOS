# Compilación y distribución

## Preparación

Use Node.js 22.12 o superior. En Windows:

```bat
instalar.bat
```

En macOS o Linux:

```bash
./scripts/macos/setup.sh
# o
./scripts/linux/setup.sh
```

Los scripts ejecutan `npm ci`, descargan explícitamente el binario de Electron con `install-electron` y verifican la estructura del proyecto.

## Windows

```bat
compilar-windows.bat
```

Genera instalador NSIS y ejecutable portable en `dist/`.

## macOS

```bash
./scripts/macos/build-macos.sh
```

Genera DMG y ZIP. `compilar-mac.bat` existe como acceso desde Windows, pero un DMG confiable debe compilarse y firmarse en macOS.

## Linux

```bash
./scripts/linux/build-linux.sh
```

Genera AppImage y paquete DEB. `compilar-linux.bat` es un wrapper para entornos Windows capaces de ejecutar el toolchain, pero el runner nativo Linux es la opción recomendada.

## Construcción automatizada

`.github/workflows/release.yml` usa runners nativos:

- `windows-latest` → NSIS y portable;
- `macos-latest` → DMG y ZIP;
- `ubuntu-latest` → AppImage y DEB.

Se activa manualmente o con una etiqueta `v*`.

## Firma

Los artefactos locales no están firmados por defecto. Para distribución pública configure certificados de Windows y Apple mediante secretos del repositorio. Nunca incluya certificados, contraseñas ni perfiles de firma dentro del código.

## Antes de publicar

1. Actualizar versión y `CHANGELOG.md`.
2. Ejecutar `npm run demo:generate` y `npm run db:template`.
3. Ejecutar `npm test`, `npm run lint`, `npm run verify`, `npm run test:e2e` y `npm run screenshots`.
4. Probar instalación, primer inicio, respaldo y apertura de demo.
5. Confirmar que `database/cafetal-os.db` no contiene finca, clientes ni movimientos.
6. Revisar `npm audit --omit=dev` y documentar riesgos aceptados.
7. Firmar y comprobar hash de artefactos.
