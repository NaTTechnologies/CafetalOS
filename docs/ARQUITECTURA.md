# Arquitectura técnica

## Capas

1. **Proceso principal (`src/main`)**: ciclo de vida de Electron, persistencia SQLite, exportaciones, respaldo y handlers IPC.
2. **Preload (`src/preload`)**: contrato explícito entre el renderer y Electron.
3. **Renderer (`src/renderer`)**: Vue 3, navegación, sistema visual y componentes.
4. **Dominio heredado (`public/legacy`)**: módulos operativos existentes encapsulados para conservar funcionalidad durante la migración.

## Decisión de migración incremental

Reescribir simultáneamente más de quince módulos y ocho mil líneas de lógica de interfaz eleva el riesgo de pérdida funcional. La versión 2.0 usa un patrón **Strangler Fig**: Vue controla el shell, ciclo de navegación y dashboard; cada módulo heredado se monta dentro de un host aislado. En nuevas contribuciones, la lógica debe trasladarse gradualmente a servicios y componentes Vue.

## Contrato IPC

El renderer solo accede a métodos definidos en `window.api`. Cada operación debe tener un canal fijo. No se aceptan canales arbitrarios ni acceso directo a Node.js.

## Persistencia

- Producción: `cafetal-os.db` en `app.getPath('userData')`.
- Demo: `cafetal-os-demo-runtime.db` en la misma carpeta.
- Plantillas: `database/cafetal-os.db` y `database/cafetal-os-demo.db` empaquetadas como recursos de solo lectura.

## Próxima separación recomendada

- `database/service.js`: inicialización, migraciones y transacciones.
- `ipc/<modulo>.js`: handlers agrupados por dominio.
- `domain/<modulo>/`: validadores y casos de uso testeables sin Electron.
- `renderer/src/features/<modulo>/`: vistas, componentes y composables Vue.

## Autenticación local

`src/main/auth-store.js` administra un almacén JSON independiente de las bases cafetaleras. Utiliza `crypto.scrypt` y sales aleatorias. El proceso principal conserva una sesión por `webContents.id` y `secureHandle` protege los canales IPC.

La separación evita que el cambio entre producción y demo reemplace las cuentas del equipo.

## Cambio de base en tiempo de ejecución

`switchDatabaseMode(mode, reset)` guarda y cierra la instancia SQL.js, selecciona la plantilla apropiada, abre el archivo runtime y actualiza `runtimeMode`. El renderer se recarga desde Configuración para volver a montar todos los adaptadores con la nueva base.

## Contenedores de desplazamiento

La cuadrícula principal tiene altura fija al viewport y `min-height: 0`. El sidebar y el workspace implementan scroll independiente. Los estilos de compatibilidad anulan el scroll del antiguo `.page-body` para mantener un único propietario del desplazamiento vertical del módulo.

## Servidor MCP local

El mismo bundle del proceso principal dispone de un modo alternativo:

```text
Cliente de IA local
      │ JSON-RPC por stdin/stdout
      ▼
Cafetal OS --mcp
      │ tools de dominio
      ▼
Base SQL.js local
```

Cuando existe `--mcp`, Electron no crea `BrowserWindow`, no inicia autenticación visual y reserva `stdout` para mensajes MCP. La implementación está en `src/main/mcp-server.js`. El modo es de solo lectura salvo `--write`.

Esta separación evita exponer Node.js o la base directamente al renderer y evita que un modelo ejecute SQL arbitrario. Las tools traducen intenciones de dominio a consultas parametrizadas.

## Validación en capas

```text
Formulario / ayuda contextual
        │
        ▼
validacion.js (UX inmediata)
        │ IPC explícito
        ▼
domain-validation.js (reglas obligatorias)
        │
        ▼
reglas transversales con estado de base
        │
        ▼
SQL parametrizado + persistencia
```

La interfaz puede calcular y advertir, pero la autoridad final está en el proceso principal. Las reglas que dependen de registros existentes —código duplicado, área disponible, lote activo y existencias— se verifican inmediatamente antes de persistir.

## Generación de reportes

El proceso principal lee `configuracion`, resuelve el logotipo seguro y construye PDF con PDFKit. La plantilla usa páginas bufferizadas para insertar encabezado, pie y numeración después de conocer el total de páginas. El renderer únicamente solicita la exportación mediante IPC.

## Planillas y registro masivo

La captura amplia se divide en dos responsabilidades:

```text
registro-masivo.js
  ├─ definición de columnas y listas
  ├─ pegado tabulado y estado visual
  └─ validación previa por IPC
          │
          ▼
main/index.js
  ├─ normalizeBulkRow
  ├─ validateBulkRelations
  ├─ validateBulkPayload
  └─ transacción BEGIN/COMMIT/ROLLBACK
```

La planilla semanal utiliza una cabecera `planillas_corte` y movimientos en `recoleccion`. De esa forma no duplica el motor de reportes: la matriz es una experiencia de captura y los movimientos diarios siguen siendo la fuente operativa.

## Orígenes de café

La arquitectura admite dos rutas:

```text
Lote propio ──► Recolección ──► Beneficio ──► Inventario
Proveedor ────► Compra/calidad ─┬───────────► Inventario
                                └─► Beneficio ─► Inventario
```

Las columnas `compra_id`, `origen_tipo` y `costo_origen` conservan la relación. El lote `ACOPIO-EXTERNO` es una compatibilidad temporal y se excluye de indicadores agronómicos.

## Educación por usuario

El contenido vive en tablas comunes; progreso y evaluaciones se vinculan al identificador de la sesión autenticada. El renderer no recibe autorización para guardar progreso en nombre de otra cuenta.
