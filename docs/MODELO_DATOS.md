# Modelo de datos

La persistencia usa SQLite ejecutado mediante `sql.js`. El esquema se encuentra en `database/schema.sql` y debe permanecer idempotente.

## Núcleo operativo

| Tabla | Propósito | Relaciones principales |
|---|---|---|
| `finca` | Información general de la unidad productiva. | Padre de `lotes` y `certificaciones`. |
| `variedades` | Catálogo de variedades de café. | Referenciada por `lotes` y perfiles de sabor. |
| `lotes` | Parcelas productivas. | Finca, variedad, cosecha, beneficio, gastos y sostenibilidad. |
| `recolectores` | Personas que participan en el corte. | Referenciada por `recoleccion`. |
| `recoleccion` | Cortes diarios y pago operativo. | Lote y recolector. |
| `beneficio` | Transformación de cereza a pergamino. | Lote; origen de entradas a inventario. |
| `inventario` | Entradas, salidas y ajustes por producto. | Lote y, cuando aplica, beneficio. |
| `gastos` | Costos por categoría y período. | Lote opcional. |

## Calidad y sostenibilidad

- `calidad_evaluaciones`: puntaje SCA y atributos sensoriales.
- `huella_carbono`: actividad, cantidad y CO2e estimado.
- `practicas_regenerativas`: prácticas por lote, área y vigencia.
- `certificaciones`: tipo, entidad, fechas y archivo de referencia.

## Trazabilidad

- `lotes_origen` relaciona lote, cosecha, beneficio e inventario mediante un código único.
- `bloques_trazabilidad` forma una cadena local con `hash_bloque` y `hash_anterior`.

La cadena debe ser verificable y no se debe modificar un bloque histórico sin reconstruirla explícitamente. No representa consenso distribuido.

## Mercado y clientes

- `precios_historicos`, `benchmarks`.
- `clientes_marketing`, `campanas_marketing`, `lealtad_puntos`.
- `perfiles_sabor`, `recomendaciones_cliente`.

## Clima y conocimiento

- `registros_clima`, `alertas_fitosanitarias`.
- `articulos`, `tips_contextuales`.

## Convenciones

- Fechas de negocio: `YYYY-MM-DD`.
- Fecha/hora técnica: formato SQLite local o ISO 8601 según tabla.
- Importes: `REAL`, mostrados en lempiras cuando corresponda.
- Quintal: 46 kg en cálculos internos.
- Borrado lógico: se utiliza `activo` en entidades maestras; los movimientos históricos requieren revisión antes de borrado físico.

## Cambios de esquema

Cada cambio debe:

1. ser idempotente;
2. preservar bases existentes;
3. incluir prueba de migración y respaldo;
4. documentar valores por defecto;
5. actualizar demo, manual y changelog.
