# Soporte

## Problemas de instalación

1. Confirme `node --version`.
2. Ejecute `instalar.bat` o `npm ci`.
3. Confirme que existen:

```text
node_modules/electron/path.txt
node_modules/electron/dist/electron.exe   # Windows
```

4. Ejecute `npm run verify`.
5. Inicie con `npm run dev`.

## Electron no abre

Ejecute:

```bash
npm run build:app
npm run test:e2e
```

La prueba captura stdout/stderr del proceso principal. Un error antes de `firstWindow()` suele indicar que Electron terminó durante la inicialización de base, autenticación o carga de recursos.

## Capturas no se generan

Use exactamente:

```bash
npm run screenshots
```

No use `npx run screenshots`.

En Windows puede ejecutar `capturar-pantallas.bat`. Consulte `test-results` y `playwright-report` si falla.

## Preguntas funcionales

Revise primero:

- `docs/MANUAL_USUARIO.md`
- `docs/MODULOS.md`
- `docs/CONFIGURACION_Y_DEMO.md`
- `IMG/README.md`

## Vulnerabilidades

No publique detalles explotables en un issue. Siga [SECURITY.md](SECURITY.md).
