# Planillas semanales de corte

La planilla semanal replica la libreta de campo utilizada por una cuadrilla: **una fila por cortador** y **una columna por día**, normalmente de lunes a viernes. La cabecera muestra el día y la fecha real para evitar confusiones entre semanas.

## Objetivo

Registrar una cuadrilla completa sin abrir un formulario por cada persona y cada día. Al guardar, Cafetal OS convierte las celdas de la matriz en movimientos individuales de `recoleccion`, por lo que los reportes, pagos, lotes y análisis existentes siguen funcionando.

## Abrir la planilla

1. Entre en **Cosecha**.
2. Pulse **Planilla semanal**.
3. Seleccione el lote y la semana.
4. Defina de cinco a siete días, unidad, precio por unidad y peso de referencia.
5. Escriba la cantidad cortada por cada persona y día.
6. Revise los totales de fila, kilos y pago general.
7. Pulse **Guardar semana**.

La temporada que contiene la fecha de inicio aporta automáticamente unidad, precio y peso predeterminados cuando la planilla todavía no existe.

## Unidades

- **Lata:** unidad operativa de campo. Se convierte a kilogramos con el peso de referencia configurado.
- **Canasta:** se maneja igual que una unidad de campo con peso configurable.
- **Kilogramo:** se registra directamente sin conversión.

La unidad operativa sirve para administrar el trabajo y el pago. En operaciones comerciales nacionales, Cafetal OS registra las compras de café por peso, no por lata.

## Actualización segura

La combinación `lote + semana_inicio` es única. Guardar de nuevo una semana:

- actualiza las celdas existentes;
- crea las nuevas;
- elimina los movimientos cuya cantidad cambió a cero;
- no duplica la planilla.

Toda la actualización se realiza dentro de una transacción. Si una fila contiene un recolector inválido o una cantidad negativa, no se guarda ninguna celda del bloque.

## Rentabilidad por semana

Cosecha muestra una tarjeta de seguimiento que relaciona:

- kilos de cereza;
- pago a cortadores;
- procesos del mismo lote en los 45 días posteriores;
- gastos del lote en esa ventana;
- ventas del lote en los 180 días posteriores;
- costo directo y margen de referencia.

Estos valores son **estimaciones operativas**, porque varios cortes del mismo lote pueden mezclarse en un proceso o venta. Para rentabilidad contable exacta se requiere trazabilidad de lotes de transformación y venta.

## Modelo de datos

- `temporadas_cafe`: ciclo productivo, fechas y valores predeterminados.
- `planillas_corte`: cabecera semanal por lote.
- `recoleccion.planilla_id`: vínculo de cada corte diario con su planilla.
- `recoleccion.unidad_corte` y `cantidad_unidad`: cantidad original de campo.

## Casos especiales

- Una persona sin corte ese día queda en blanco o cero y no genera movimiento.
- Una cuadrilla nueva se crea desde **+ Cortadores** o mediante **Cortadores masivos**.
- La planilla admite semanas de cinco, seis o siete días.
- El peso por lata o canasta debe corresponder al recipiente realmente usado en la operación.
