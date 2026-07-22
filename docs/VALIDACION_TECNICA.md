# Validación técnica — Cafetal OS 2.6.0

## Alcance revisado

- corrección de la planilla semanal de cortadores;
- integración climática Open-Meteo;
- geolocalización y búsqueda manual de ubicaciones;
- caché climática local y tolerancia a fallos;
- esquema, migraciones y bases SQLite;
- contrato preload/IPC;
- datos demostrativos;
- documentación y release workflow.

## Corrección de la planilla semanal

El fallo `loteId is not defined` se originaba en el renderer al construir la solicitud IPC. La llamada ahora envía explícitamente el identificador seleccionado:

```js
window.api.planillas.getWeek({ loteId: Number(lotId), weekStart })
```

También se incorporó una prueba de regresión que rechaza la forma anterior con la variable inexistente.

## Comprobaciones estáticas realizadas

- Sintaxis de `src/main/index.js`, `src/main/weather-service.js`, `src/main/domain-validation.js`, preload y scripts legacy modificados.
- Presencia de las variables requeridas de Open-Meteo: temperatura, humedad relativa y presión superficial.
- Reglas de humedad alta, baja y estable.
- TTL climático predeterminado de 30 minutos.
- Ruta de caché vigente y fallback con caché vencida cuando el proveedor no responde.
- Contrato IPC para ubicación, búsqueda, clima actual y estado del proveedor.
- Verificación de versión `2.6.0` en package, lockfile, interfaz, citación y notas de release.
- Verificación de archivos esenciales mediante `scripts/verify-project.js`.

## Integridad de las bases

Se comprobó en la base productiva y en la base demo:

- `PRAGMA integrity_check = ok`;
- cero errores en `PRAGMA foreign_key_check`;
- tabla `clima_api_cache` presente;
- columnas climáticas nuevas presentes;
- configuración de ubicación y proveedor presente.

La base productiva conserva cero registros operativos. La demo incluye:

- 20 cortadores activos;
- 3 planillas semanales;
- 180 celdas de corte vinculadas a planillas;
- 365 lecturas climáticas;
- una respuesta de clima en caché para demostrar el modo offline;
- 49 ventas y 5 compras relacionadas con inventario.

## Validación reproducible completa

En un equipo con acceso al registro npm:

```bash
npm ci
npx install-electron --no
npm test
npm run lint
npm run verify
npm run build:app
npm run mcp:inspect
npm run screenshots
```

## Limitación del entorno de preparación

La instalación completa de dependencias npm no concluyó dentro del entorno de preparación. Por ello no se afirma que Vitest, ESLint, Electron Builder o Playwright hayan sido ejecutados aquí para esta versión. El workflow de GitHub ejecutará esas etapas antes de publicar los instaladores; la release no debe considerarse validada hasta que todos los jobs terminen correctamente.
