# Estrategia de pruebas

## Capas

1. **Unidad:** formatters, navegación, validadores y almacén de autenticación.
2. **Componentes:** renderizado Vue con `@vue/test-utils`.
3. **Contrato:** API expuesta por preload y limpieza de listeners.
4. **Integridad de datos:** demo completa, producción limpia y continuidad de trazabilidad.
5. **E2E:** login, dashboard, búsqueda, scroll independiente, configuración y navegación con Playwright Electron.
6. **Documentación visual:** captura reproducible de todas las interfaces en `IMG/`.

## Ejecutar

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run screenshots
```

## Pruebas de autenticación

`auth-store.spec.js` comprueba:

- creación de la cuenta inicial;
- autenticación de `admin`;
- ausencia de contraseñas en texto plano;
- creación de múltiples usuarios;
- protección del último administrador activo.

Las pruebas E2E usan `--user-data-path=<temporal>` para no tocar datos reales ni credenciales existentes.

## Prueba de demo

`demo-integrity.spec.js` comprueba:

- operación principal con volumen suficiente;
- datos en todos los módulos complementarios;
- separación entre plantilla productiva y demo;
- continuidad de `hash_anterior` en la cadena de trazabilidad.

## Scroll y navegación

La prueba E2E confirma que:

- el panel central puede desplazarse en Beneficio;
- el sidebar conserva su contenedor de scroll;
- la búsqueda abre el módulo seleccionado;
- Configuración expone controles de demo y usuarios.

## Capturas

`tests/e2e/screenshots.spec.js` genera una captura `fullPage` del login, todos los módulos y cada pestaña de Configuración. Consulte [CAPTURAS_PLAYWRIGHT.md](CAPTURAS_PLAYWRIGHT.md).

## Criterio mínimo para pull requests

- Todas las pruebas pasan.
- No se reduce cobertura de lógica modificada.
- Un cambio de interfaz incluye prueba de componente o E2E.
- Un cambio visual significativo regenera `IMG/`.
- Un canal IPC nuevo incluye prueba de contrato y autenticación.
- Un cambio de esquema incluye prueba sobre una base existente y otra nueva.
- Los fixtures no contienen información real.
