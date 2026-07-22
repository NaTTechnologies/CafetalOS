# Estrategia de pruebas

Cafetal OS combina pruebas unitarias, integridad de base, contrato IPC, compilación y recorridos Electron con Playwright.

## Comandos

```bash
npm test
npm run test:coverage
npm run lint
npm run verify
npm run build:app
npm run test:e2e
npm run screenshots
npm run mcp:inspect
```

## Capas

### Dominio

`tests/unit/domain-validation.spec.js` cubre:

- lotes, área y fechas;
- cosecha y pagos;
- beneficio y rendimiento;
- inventario y ventas;
- gastos;
- proveedores y compras;
- conversiones kg/qq;
- humedad y advertencias;
- temporadas.

### Flujos masivos

`tests/unit/bulk-workflows.spec.js` verifica:

- entidades permitidas;
- presencia de campos relacionados;
- transacción y rollback;
- protección contra duplicados;
- existencia proyectada;
- compra masiva e inventario derivado.

### Demo e integridad

`tests/unit/demo-integrity.spec.js` comprueba que:

- producción esté vacía;
- demo contenga módulos principales;
- existan temporadas, planillas, proveedores y compras;
- educación tenga progreso;
- la cadena de trazabilidad sea continua;
- no existan datos reales identificables.

### Preload e IPC

`tests/unit/preload-contract.spec.js` valida que el renderer reciba métodos explícitos para:

- temporadas y planillas;
- proveedores y compras;
- actualización de calidad;
- registro masivo;
- progreso educativo;
- configuración y MCP.

### Navegación y responsive

Las pruebas incluyen búsqueda, módulo Compras, drawer móvil, backdrop, autenticación accesible y ayuda/educación responsive.

### MCP

`tests/unit/mcp-server.spec.js` valida la publicación de 14 tools de lectura, tools de escritura opcionales, recursos y esquemas cerrados.

## Playwright Electron

### Prueba de humo

```bash
npm run test:e2e
```

Comprueba inicio, login, navegación y cierre.

### Galería

```bash
npm run screenshots
```

Captura:

- módulos desktop y móvil;
- configuración;
- planilla semanal;
- registro masivo de lotes;
- compras masivas;
- ayuda y educación responsive.

Playwright usa un perfil temporal en `.tmp/screenshots-user-data`. Los resultados de error quedan en `test-results/` y `playwright-report/`.

## Datos de prueba

- Use `database/cafetal-os-demo.db`.
- No use respaldos reales.
- Los códigos demo deben conservar prefijo o contexto ficticio.
- Correos de ejemplo deben usar dominios reservados como `.example`.

## Criterios para una contribución

| Cambio | Evidencia mínima |
|---|---|
| Regla de cálculo | Prueba unitaria. |
| Nueva tabla | Migración, demo e integridad. |
| Canal IPC | Handler, preload y prueba de contrato. |
| Registro masivo | Validación, rollback y caso derivado. |
| Planilla de corte | creación, actualización, ceros y totales. |
| Compra/acopio | calidad, inventario y doble procesamiento. |
| Componente Vue | Vue Test Utils y accesibilidad. |
| Cambio visual | capturas desktop/móvil. |
| Tool MCP | esquema cerrado, handler y prueba. |

## Diagnóstico

### Electron ausente

```bash
npx install-electron --no
node scripts/check-electron.js
```

### Captura intermitente

```bash
npm run screenshots:debug
npx playwright show-trace test-results/<caso>/trace.zip
```

### Dependencias

Use `npm ci`, no `npm install`, en CI y releases para respetar `package-lock.json`.
