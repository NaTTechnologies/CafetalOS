# Checklist de release

## Código y datos

- [ ] `package.json`, `package-lock.json`, `CITATION.cff` y tag usan la misma versión.
- [ ] `npm test`, `npm run lint`, `npm run verify` y `npm run build:app` terminan correctamente.
- [ ] La plantilla productiva está vacía y la demo se regenera.
- [ ] Las migraciones abren una copia de una base anterior.
- [ ] Planilla semanal guarda, actualiza y elimina celdas en cero sin duplicar.
- [ ] Registro masivo rechaza el bloque completo cuando una fila falla.
- [ ] Compras aprobadas crean inventario y una compra no se envía dos veces a beneficio.
- [ ] El lote técnico de acopio no aparece en KPI ni listados normales.

## Interfaz y documentación

- [ ] Capturas desktop y móvil se regeneran con `npm run screenshots`.
- [ ] Se capturan planilla semanal, registro masivo y compras masivas.
- [ ] Ayuda y Educación funcionan a 430 × 900.
- [ ] README, changelog, manual, modelo de datos, API IPC y notas de versión están actualizados.
- [ ] Los PDF de una y varias páginas respetan el membrete configurado.

## Seguridad y distribución

- [ ] MCP inicia en solo lectura y `npm run mcp:inspect` termina correctamente.
- [ ] No hay bases runtime, respaldos, credenciales, tokens, `node_modules`, `out` ni `dist` en el ZIP fuente.
- [ ] `SOURCE_MANIFEST.sha256` se regeneró después del último cambio.
- [ ] La etiqueta `vX.Y.Z` existe y coincide con `package.json`.
- [ ] GitHub Actions publica instaladores y `SHA256SUMS.txt` en Releases.
