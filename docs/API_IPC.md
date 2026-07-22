# Contrato IPC

El renderer no accede directamente a Node.js ni a SQLite. `src/preload/index.js` expone una API explícita mediante `contextBridge`; el proceso principal registra cada canal con `secureHandle` y exige una sesión válida vinculada a la ventana.

## Principios

- No existe un canal genérico para ejecutar SQL.
- Cada método tiene una responsabilidad de dominio.
- El renderer puede orientar la captura, pero el proceso principal valida nuevamente.
- Operaciones masivas se ejecutan dentro de una transacción.
- Cambios de contrato requieren prueba de preload y actualización de este documento.

## Sesión y sistema

| API renderer | Canal |
|---|---|
| `api.auth.login(data)` | `auth:login` |
| `api.auth.getCurrent()` | `auth:getCurrent` |
| `api.auth.logout()` | `auth:logout` |
| `api.auth.listUsers()` | `auth:listUsers` |
| `api.auth.createUser(data)` | `auth:createUser` |
| `api.auth.updateUser(id,data)` | `auth:updateUser` |
| `api.auth.changePassword(data)` | `auth:changePassword` |
| `api.db.backup()` | `db:backup` |
| `api.db.getStatus()` | `db:getStatus` |
| `api.db.switchMode(options)` | `db:switchMode` |
| `api.config.getAll()` | `config:getAll` |
| `api.config.update(values)` | `config:update` |

## Finca, lotes y cuadrillas

| API | Canal |
|---|---|
| `api.finca.get()` | `finca:get` |
| `api.finca.update(data)` | `finca:update` |
| `api.variedades.getAll()` | `variedades:getAll` |
| `api.lotes.getAll()` | `lotes:getAll` |
| `api.lotes.create(data)` | `lotes:create` |
| `api.lotes.update(id,data)` | `lotes:update` |
| `api.lotes.delete(id)` | `lotes:delete` |
| `api.recolectores.getAll()` | `recolectores:getAll` |
| `api.recolectores.create(data)` | `recolectores:create` |
| `api.recolectores.getRanking(fi,ff,limite)` | `recolectores:getRanking` |

## Temporadas y planillas de corte

| API | Canal | Resultado |
|---|---|---|
| `api.temporadas.getAll()` | `temporadas:getAll` | Lista de temporadas. |
| `api.temporadas.create(data)` | `temporadas:create` | Crea temporada validada. |
| `api.planillas.getWeek(options)` | `planillas:getWeek` | Cabecera, días, cuadrilla y celdas de una semana. |
| `api.planillas.list()` | `planillas:list` | Planillas recientes. |
| `api.planillas.getProfitability(limit)` | `planillas:getProfitability` | Seguimiento operativo por semana. |
| `api.planillas.saveWeek(payload)` | `planillas:saveWeek` | Guarda o actualiza la matriz completa. |

`planillas:saveWeek` valida lote, fechas, unidad, precio, peso, cortadores y cantidades. La combinación lote/semana es única.

## Cosecha

- `cosecha:getByDate`
- `cosecha:getByLote`
- `cosecha:create`
- `cosecha:delete`
- `cosecha:getResumen`
- `cosecha:getLastDays`
- `cosecha:getResumenPorPeriodo`

## Proveedores, compras y acopio

| API | Canal |
|---|---|
| `api.proveedoresCafe.getAll()` | `proveedoresCafe:getAll` |
| `api.proveedoresCafe.create(data)` | `proveedoresCafe:create` |
| `api.comprasCafe.getAll(filters)` | `comprasCafe:getAll` |
| `api.comprasCafe.getSummary()` | `comprasCafe:getSummary` |
| `api.comprasCafe.nextCode()` | `comprasCafe:nextCode` |
| `api.comprasCafe.create(data)` | `comprasCafe:create` |
| `api.comprasCafe.setStatus(id,status)` | `comprasCafe:setStatus` |
| `api.comprasCafe.updateQuality(id,data)` | `comprasCafe:updateQuality` |
| `api.comprasCafe.sendToBenefit(id,data)` | `comprasCafe:sendToBenefit` |

Reglas relevantes:

- una compra aprobada o condicionada puede crear inventario;
- el control configurado exige humedad/defectos según producto;
- una compra enviada a beneficio no puede enviarse nuevamente;
- rechazar una compra ya incorporada requiere una reversión explícita.

## Registro masivo

| API | Canal |
|---|---|
| `api.bulk.validate(entity,rows)` | `bulk:validate` |
| `api.bulk.save(entity,rows)` | `bulk:save` |

Entidades permitidas:

```text
lote
recolector
cosecha
beneficio
inventario
gasto
proveedor_cafe
compra_cafe
clima
calidad
```

`bulk:validate` devuelve por fila: índice, normalización, estado, errores y advertencias. `bulk:save` repite toda la validación y usa `BEGIN TRANSACTION`/`ROLLBACK`.

## Beneficio, inventario y gastos

- `beneficio:getAll`, `beneficio:create`, `beneficio:delete`, `beneficio:rendimientoPorLote`.
- `inventario:getResumen`, `inventario:getMovimientos`, `inventario:create`, `inventario:delete`.
- `gastos:getAll`, `gastos:create`, `gastos:delete`, `gastos:resumen`, `gastos:total`, `gastos:getCategorias`.

## Educación

| API | Canal |
|---|---|
| `api.educacion.getArticulos(categoria)` | `educacion:getArticulos` |
| `api.educacion.getArticulo(id)` | `educacion:getArticulo` |
| `api.educacion.getTip(modulo,accion)` | `educacion:getTip` |
| `api.educacion.getProgress()` | `educacion:getProgress` |
| `api.educacion.saveProgress(data)` | `educacion:saveProgress` |
| `api.educacion.saveQuiz(data)` | `educacion:saveQuiz` |

El usuario autenticado se obtiene de la sesión del proceso principal; el renderer no puede asignar progreso a otro usuario.


## Clima por Open-Meteo

| API | Canal | Resultado |
|---|---|---|
| `api.clima.getLocation()` | `clima:getLocation` | Ubicación configurada o derivada de Mi finca. |
| `api.clima.setLocation(data)` | `clima:setLocation` | Guarda coordenadas, nombre y zona horaria. |
| `api.clima.searchLocations(query)` | `clima:searchLocations` | Coincidencias de Open-Meteo Geocoding. |
| `api.clima.getCurrent(options)` | `clima:getCurrent` | Clima actual, pronóstico, alertas, proveedor y estado de caché. |
| `api.clima.getProviderStatus()` | `clima:getProviderStatus` | Conectividad, proveedor y TTL. |
| `api.clima.getRegistros(dias)` | `clima:getRegistros` | Bitácora meteorológica local. |
| `api.clima.crearRegistro(data)` | `clima:crearRegistro` | Lectura manual o de estación. |
| `api.clima.getAlertas()` | `clima:getAlertas` | Alertas fitosanitarias activas. |

`clima:getCurrent` ejecuta la petición HTTP en el proceso principal mediante `net.fetch`. La caché predeterminada dura 30 minutos. Si la red falla y existe una lectura anterior, la respuesta incluye `offline: true` y `cache.stale: true` en vez de interrumpir la interfaz.

## Otros grupos

La API también publica métodos explícitos para:

- dashboard y rentabilidad;
- PDF y Excel;
- sostenibilidad y certificaciones;
- calidad;
- trazabilidad y QR;
- mercado;
- marketing y fidelización;
- clima y alertas;
- perfiles de café;
- información MCP y documentación.

## Evolución del contrato

Al agregar un canal:

1. defina la regla de dominio;
2. implemente y autorice el handler;
3. exponga solo el método necesario en preload;
4. agregue prueba de contrato;
5. documente argumentos, respuesta y efectos laterales;
6. actualice capturas o manual cuando exista interfaz nueva.
