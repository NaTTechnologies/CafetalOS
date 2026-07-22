# Modelo de datos

Cafetal OS utiliza SQLite ejecutado mediante `sql.js`. El esquema canónico está en `database/schema.sql`; las migraciones del proceso principal preservan bases creadas por versiones anteriores.

## Unidad productiva y lotes

| Tabla | Propósito | Relaciones |
|---|---|---|
| `finca` | Información general de la operación activa. | Padre de lotes y certificaciones. |
| `variedades` | Catálogo de variedades. | Lotes y perfiles sensoriales. |
| `lotes` | Parcelas productivas. | Finca, variedad, cosecha, beneficio y gastos. |

`lotes.es_sistema = 1` identifica lotes técnicos ocultos, como `ACOPIO-EXTERNO`. Estos registros permiten mantener compatibilidad con procesos heredados y no aparecen en KPI agronómicos.

## Temporadas, cuadrillas y corte

| Tabla/campo | Propósito |
|---|---|
| `temporadas_cafe` | Define ciclo, fechas, estado, unidad de corte, precio y peso predeterminados. |
| `recolectores` | Personas que integran las cuadrillas. |
| `planillas_corte` | Cabecera única por lote y semana. |
| `recoleccion` | Movimiento diario de una persona en un lote. |
| `recoleccion.planilla_id` | Vincula el movimiento con la planilla semanal. |
| `recoleccion.unidad_corte` | Conserva lata, canasta o kilogramo. |
| `recoleccion.cantidad_unidad` | Cantidad original capturada en campo. |

La planilla se descompone en movimientos diarios para que los reportes existentes continúen operando.

## Compras y acopio

| Tabla/campo | Propósito |
|---|---|
| `proveedores_cafe` | Productor, finca, cooperativa u otro origen comercial. |
| `compras_cafe` | Recepción por peso, producto, precio, calidad, ubicación y trazabilidad. |
| `compras_cafe.inventario_id` | Entrada creada cuando la compra se aprueba o condiciona. |
| `beneficio.compra_id` | Compra que originó un proceso. |
| `beneficio.origen_tipo` | `propio` o `comprado`. |
| `inventario.compra_id` | Compra que originó el movimiento. |
| `inventario.costo_origen` | Costo atribuible al producto recibido. |

Estados físicos admitidos: `cereza`, `pergamino_humedo`, `pergamino_seco`, `verde` y `tostado`.

Estados de calidad: `pendiente`, `aprobado`, `condicionado` y `rechazado`.

## Transformación, inventario y costos

- `beneficio`: cereza o materia prima, proceso, fermentación, secado, humedad y pergamino.
- `inventario`: entradas, salidas, ajustes y ventas en kg y qq.
- `gastos`: costos por categoría, lote, cantidad, costo unitario y total.

El quintal se representa actualmente como 46 kg en los cálculos internos.

## Calidad, sostenibilidad y trazabilidad

- `calidad_evaluaciones`: puntaje y atributos sensoriales.
- `huella_carbono`: actividad, cantidad y CO2e estimado.
- `practicas_regenerativas`: práctica, lote, área y vigencia.
- `certificaciones`: tipo, entidad y fechas.
- `lotes_origen`: código que relaciona lote, cosecha, beneficio e inventario.
- `bloques_trazabilidad`: cadena local con `hash_bloque` y `hash_anterior`.

La cadena hash ayuda a detectar alteraciones; no representa consenso distribuido ni certificación de terceros.

## Educación

| Tabla | Propósito |
|---|---|
| `articulos` | Contenido educativo. |
| `tips_contextuales` | Recomendaciones breves por módulo/acción. |
| `progreso_educacion` | Avance y estado por usuario/artículo. |
| `evaluaciones_educacion` | Puntaje, total y respuestas de ejercicios. |

## Configuración

La tabla `configuracion` almacena claves como:

- `operacion_tipo`;
- `cosecha_dias_semana`;
- `compra_control_calidad`;
- datos y colores del membrete;
- ruta y visibilidad del logotipo.

## Convenciones

- Fecha de negocio: `YYYY-MM-DD`.
- Fecha/hora técnica: SQLite local o ISO 8601 según el caso.
- Importes: `REAL`, normalmente mostrados en lempiras.
- Borrado lógico: `activo` para entidades maestras.
- Relaciones: se validan nuevamente en el proceso principal.
- Operaciones masivas: transacción completa con rollback ante cualquier error.

## Reglas para cambios de esquema

1. Mantener el esquema idempotente.
2. Agregar migración para bases existentes.
3. Preservar datos productivos.
4. Actualizar plantilla, demo y pruebas de integridad.
5. Documentar columnas, valores predeterminados y reversión.
6. Crear respaldo antes de probar una migración sobre datos reales.
