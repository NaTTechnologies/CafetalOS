# Integración MCP de Cafetal OS

El servidor MCP se integra en el proceso principal de Electron para estar disponible tanto desde el código fuente como desde los instaladores.

- Implementación: `src/main/mcp-server.js`
- Validaciones de dominio: `src/main/domain-validation.js`
- Lanzador del repositorio: `scripts/run-mcp.cjs`
- Prueba de humo: `scripts/mcp-smoke-test.cjs`
- Guía completa: [`docs/MCP_IA_LOCAL.md`](../docs/MCP_IA_LOCAL.md)
- Ejemplos de clientes: [`mcp/clients`](clients/)

## Inicio rápido

```bash
npm run mcp:demo
```

El modo normal es de solo lectura. La versión 2.6.0 publica 14 tools de consulta, incluyendo planillas semanales y compras/acopio. No agregue `--write` a una configuración compartida o predeterminada sin explicar claramente el riesgo al usuario.

## Ejemplos incluidos

- `generic-readonly.example.json`: instalación compilada y base productiva.
- `generic-demo.example.json`: instalación compilada y base demo.
- `source-windows.example.json`: repositorio local ejecutado con Node y Electron.

Cada cliente MCP usa un formato de configuración propio. Adapte el nombre del contenedor (`mcpServers`, `servers` u otro) a la documentación del cliente sin cambiar el comando ni los argumentos generados por Cafetal OS.
