# MCP local para inteligencia artificial

Cafetal OS incluye un servidor **Model Context Protocol (MCP)** por transporte **stdio**. Un cliente compatible puede consultar la base local mediante tools cafetaleras sin abrir un puerto de red ni recibir acceso SQL arbitrario.

El proceso MCP se ejecuta en el mismo equipo que la base. El cliente de inteligencia artificial puede procesar o sincronizar las respuestas según su propia configuración y política.

## Principios

- **Local primero:** la base y el servidor permanecen en el equipo.
- **Solo lectura por defecto:** iniciar MCP no modifica datos.
- **Tools de dominio:** operaciones como analizar lote, corte o compras.
- **Escritura explícita:** solo aparece al iniciar con `--write`.
- **Esquemas cerrados:** argumentos adicionales y tipos incorrectos se rechazan.
- **Sin SQL libre:** el modelo no puede construir consultas arbitrarias.
- **Sin credenciales:** usuarios, hashes y contraseñas no se publican.

## Ejecución

```bash
npm ci
npx install-electron --no
npm run build:app
```

Solo lectura sobre producción:

```bash
npm run mcp
```

Solo lectura sobre demo:

```bash
npm run mcp:demo
```

Escritura controlada:

```bash
npm run mcp:write
```

Prueba de humo:

```bash
npm run mcp:inspect
```

En Windows también puede usar `mcp.bat` y `mcp-demo.bat`.

## Configurar un cliente

La aplicación genera el JSON exacto en **Configuración → IA local (MCP)**.

Ejemplo instalado:

```json
{
  "mcpServers": {
    "cafetal-os": {
      "command": "C:\\Program Files\\Cafetal OS\\Cafetal OS.exe",
      "args": ["--mcp"]
    }
  }
}
```

Demo:

```json
{
  "mcpServers": {
    "cafetal-os-demo": {
      "command": "C:\\Program Files\\Cafetal OS\\Cafetal OS.exe",
      "args": ["--mcp", "--demo"]
    }
  }
}
```

Base explícita:

```json
{
  "mcpServers": {
    "cafetal-os": {
      "command": "C:\\Program Files\\Cafetal OS\\Cafetal OS.exe",
      "args": ["--mcp", "--db=C:\\datos\\finca.db"]
    }
  }
}
```

## Tools de lectura

| Tool | Utilidad |
|---|---|
| `cafetal_resumen_general` | Finca, lotes, cosecha anual, inventario y alertas. |
| `cafetal_listar_lotes` | Filtra lotes y producción acumulada. |
| `cafetal_analizar_lote` | Integra ficha, corte, beneficio, costos, calidad e inventario. |
| `cafetal_resumen_cosecha` | Resume período, lote, cortadores, kilos y pagos. |
| `cafetal_planillas_corte` | Resume cuadrillas y semanas de corte. |
| `cafetal_resumen_compras` | Analiza acopio por proveedor, producto, calidad, peso y costo. |
| `cafetal_resumen_beneficio` | Rendimiento, humedad y fermentación. |
| `cafetal_inventario_actual` | Existencias y saldos negativos. |
| `cafetal_resumen_financiero` | Ingresos, gastos, pagos, utilidad y rentabilidad. |
| `cafetal_alertas_operativas` | Riesgos fitosanitarios, certificaciones, humedad e inventario. |
| `cafetal_calidad_resumen` | Puntajes y atributos de taza. |
| `cafetal_trazabilidad_lote` | Ruta y bloques de un lote. |
| `cafetal_contexto_reporte` | Contexto estructurado para informes. |
| `cafetal_configuracion_reportes` | Identidad y membrete de PDF. |

La versión 2.6.0 publica **14 tools de lectura**.

## Tools de escritura

Solo aparecen con `--write`:

- `cafetal_registrar_gasto`;
- `cafetal_registrar_clima`;
- `cafetal_registrar_alerta`.

Estas operaciones validan fecha, rango, catálogo y relaciones antes de persistir.

> Evite abrir simultáneamente la interfaz y un MCP con escritura sobre el mismo archivo. Ambos procesos mantienen una copia de la base en memoria y el último guardado podría sobrescribir cambios.

## Resources

| URI | Contenido |
|---|---|
| `cafetal://finca/resumen` | Estado general de la operación. |
| `cafetal://configuracion/reportes` | Identidad institucional de PDF. |
| `cafetal://catalogo/modulos` | Catálogo funcional. |
| `cafetal://operacion/acopio` | Compras recientes y planillas de corte. |

## Prompts

- `diagnostico_finca`;
- `analisis_temporada`;
- `plan_accion_lote`.

## Casos de uso

### Reunión semanal

Use `cafetal_planillas_corte`, `cafetal_alertas_operativas` y `cafetal_resumen_general` para identificar costo de cuadrilla, volumen, riesgos y prioridades.

### Control de acopio

Use `cafetal_resumen_compras` para comparar proveedores, estados de café, humedad, decisiones de calidad y costo.

### Análisis de lote

Use `cafetal_analizar_lote` y el prompt `plan_accion_lote`. El modelo debe distinguir hechos de la base, inferencias y recomendaciones.

### Cierre de temporada

Use `cafetal_contexto_reporte` con enfoque gerencial o financiero y el prompt `analisis_temporada`.

## Contrato de una tool nueva

Una contribución MCP debe:

1. resolver una necesidad cafetalera concreta;
2. usar prefijo `cafetal_`;
3. definir `inputSchema` con `additionalProperties: false`;
4. validar argumentos antes de consultar o escribir;
5. devolver JSON estructurado;
6. evitar datos de autenticación;
7. ser de solo lectura salvo justificación;
8. incorporar prueba y documentación.

## Seguridad del transporte

`stdout` queda reservado para JSON-RPC. Logs y diagnósticos se escriben en `stderr`. El transporte `stdio` evita exponer un puerto, pero no garantiza que el cliente sea offline o privado.

## Implementación

- Servidor: `src/main/mcp-server.js`.
- Lanzador de desarrollo: `scripts/run-mcp.cjs`.
- Prueba de humo: `scripts/mcp-smoke-test.cjs`.
- Ejemplos: `mcp/clients/`.

Referencias:

- <https://modelcontextprotocol.io/specification/2025-11-25>
- <https://modelcontextprotocol.io/specification/2025-11-25/basic/transports>
