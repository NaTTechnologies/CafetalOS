# Ventas, kardex y almacenamiento del café

## Propósito

Cafetal OS separa claramente tres operaciones:

1. **Compra o recepción:** incorpora café de terceros después del control de calidad.
2. **Movimiento interno:** registra entradas, consumos, mermas y ajustes.
3. **Venta:** registra cliente, documento, precio y destino; descuenta inventario en una transacción y alimenta la rentabilidad.

## Flujo de ventas

```text
Inventario disponible
→ selección de producto y origen
→ cliente, peso y precio
→ validación de existencias
→ venta confirmada
→ movimiento de kardex
→ saldo actualizado
```

Una venta no puede confirmarse cuando la cantidad supera el saldo del producto y origen seleccionados. Al anular una venta, Cafetal OS retira el movimiento comercial y restituye el inventario.

## Kardex

El kardex presenta cronológicamente:

- fecha y documento;
- producto y lote/origen;
- entrada o salida;
- saldo acumulado;
- cliente, destino o ubicación;
- relación con compra, beneficio o venta.

La permanencia se calcula por capas de entrada aplicando una aproximación FIFO. Esta lectura permite identificar qué café debería inspeccionarse, transformarse o venderse primero.

## Alertas de permanencia

Los umbrales incluidos son **parámetros operativos de revisión**, no fechas de vencimiento universales. La estabilidad real depende de humedad, temperatura, empaque, ventilación, limpieza, plagas y condición inicial del café.

| Producto | Advertencia | Crítica | Uso operativo |
|---|---:|---:|---|
| Cereza | 1 día | 2 días | Priorizar beneficio y evitar fermentación no controlada. |
| Pergamino húmedo | 2 días | 4 días | Priorizar secado y control de humedad. |
| Pergamino seco | 180 días | 365 días | Revisar calidad, empaque y rotación. |
| Café verde/oro | 180 días | 365 días | Revisar calidad física/sensorial y almacenamiento. |
| Tostado | 21 días | 45 días | Revisar frescura y rotación comercial. |

Para pergamino seco y café verde, la aplicación genera una alerta crítica cuando la humedad registrada supera **12.5%** y una advertencia preventiva cuando supera **11.5%**.

## Fundamento técnico

La FAO recomienda evitar el rehumedecimiento, mantener almacenes bien ventilados y proteger el café de cualquier entrada de humedad. También documenta una humedad cercana al 11% como referencia favorable para almacenamiento y señala que los almacenes para café verde idealmente deben mantenerse por debajo de 65% de humedad relativa. El límite general de humedad usado en estándares internacionales de exportación es 12.5%, salvo excepciones identificadas.

Fuentes consultadas:

- FAO, *Harvesting and processing*: https://www.fao.org/4/ae939e/ae939e08.htm
- FAO, *Conclusions and Recommendations*: https://www.fao.org/4/x6939e/x6939e05.htm
- FAO, *Quality and export standards*: https://www.fao.org/4/ae939e/ae939e0a.htm
- FAO/Codex, *Code of Practice for the Prevention and Reduction of Ochratoxin A Contamination in Coffee*: https://www.fao.org/input/download/standards/11250/CXP_069e.pdf

## Interpretación responsable

Cafetal OS no declara automáticamente que un café está perdido. Una alerta significa que debe realizarse una inspección de humedad, olor, color, actividad de agua, presencia de plagas y evaluación de taza antes de decidir si se vende, reprocesa, reclasifica o descarta.
