# Validaciones inteligentes y flujos asistidos

Cafetal OS 2.4 incorpora validación en dos capas:

1. **Renderer:** mensajes inmediatos, cálculos automáticos y recomendaciones contextuales.
2. **Proceso principal:** validación de dominio antes de escribir en la base, incluso si se intenta omitir la interfaz.

## Objetivo

Un formulario no debe comportarse como una tabla de base de datos. Debe ayudar al cafetalero a registrar información coherente, calcular valores derivados y advertir situaciones que merecen revisión.

## Comportamientos incorporados

### Finca y lotes

- El área cultivada no puede superar el área total.
- Año de siembra dentro de un rango plausible.
- Altitud, densidad y área con límites operativos.
- Estimación de población a partir de área y densidad.

### Cosecha

- La fecha no puede estar en el futuro.
- Latas, peso y precio deben ser coherentes.
- Kilos y pago total se calculan automáticamente.
- Hora final posterior a la hora inicial.
- Advertencia cuando la madurez puede afectar la uniformidad.


### Planillas semanales y cargas masivas

- Una semana se identifica por lote y lunes de inicio.
- Cantidades negativas, cortadores inactivos o fechas fuera de la semana invalidan el bloque.
- Una edición actualiza movimientos existentes y elimina celdas que pasan a cero.
- Los códigos duplicados se detectan dentro de la matriz y contra la base.
- La suma de áreas de lotes se valida antes de guardar.
- El inventario se proyecta fila por fila para evitar saldos negativos dentro del mismo bloque.
- Cualquier error provoca rollback de todas las filas.

### Compras y acopio

- La recepción exige proveedor, código, fecha, producto, peso y precio coherentes.
- Kilogramos, quintales, precio equivalente y costo total se calculan automáticamente.
- Las compras aprobadas o condicionadas pueden exigir humedad y defectos según la configuración.
- Pergamino seco y café verde requieren humedad antes de aprobarse cuando el control está activo.
- Una compra ya incorporada al inventario no puede rechazarse sin reversión.
- Una compra no puede enviarse dos veces a beneficio.

### Beneficio

- Fecha final no anterior al inicio.
- Pergamino seco no mayor que la cereza ingresada.
- Rendimiento calculado automáticamente.
- Humedad fuera del intervalo configurado genera advertencia.
- Fermentaciones prolongadas solicitan revisión técnica.

### Inventario

- Conversión automática de quintales a kilogramos.
- Total de venta calculado.
- Una venta exige cliente y precio.
- El proceso principal recalcula cantidades y total.

### Gastos

- Cantidad por costo unitario genera el total.
- Fecha no futura.
- Advertencia cuando el gasto no tiene lote y reducirá la precisión de rentabilidad por parcela.

### Calidad

- Cada atributo debe estar entre 0 y 10.
- El puntaje se calcula en tiempo real y nuevamente en el proceso principal.
- La interfaz interpreta el resultado sin sustituir una evaluación profesional.

### Clima

- Humedad entre 0 y 100%.
- Temperatura máxima no menor que la mínima.
- Precipitación y viento no negativos.
- Humedad o lluvia elevada generan recomendación de vigilancia fitosanitaria.


### Sostenibilidad y certificaciones

- Emisiones con fecha, tipo y cantidad coherentes.
- Estimación orientativa de CO₂e mostrada como ayuda, no como certificación.
- Prácticas regenerativas con período válido y advertencia cuando no se asigna lote.
- Vencimiento de certificación posterior a la obtención y aviso de días restantes.

### Alertas y sanidad vegetal

- Tipo y nivel limitados a catálogos permitidos.
- Una alerta alta exige recomendación operativa.
- El lote asociado debe existir y estar activo.

### Clientes, campañas y fidelización

- Correos y teléfonos con formato válido.
- Campañas con fechas coherentes.
- Una campaña activa necesita contenido.
- Los puntos solo se asignan a clientes activos y requieren un concepto.

### Precios de mercado

- Fecha no futura.
- Tipo de café y fuente obligatorios.
- Precio positivo dentro de un rango defensivo.

## Archivos

- `src/renderer/public/legacy/validacion.js`: interacción y recomendaciones.
- `src/main/domain-validation.js`: reglas obligatorias de persistencia.
- `src/renderer/src/assets/styles/legacy.css`: estados visuales e insights.

## Añadir una regla

1. Agregue una regla básica en `Validador.rules` si puede aplicarse por campo.
2. Agregue una validación cruzada en `_validarContexto()` si depende de dos o más valores.
3. Agregue una normalización o restricción en `validateEntity()` para proteger la base.
4. Escriba una prueba unitaria.
5. Documente la razón agronómica u operativa.
6. Pruebe también el mismo caso por IPC o MCP cuando exista una vía alternativa de escritura.

## Criterio de diseño

- **Error:** impide guardar porque el dato viola una regla objetiva.
- **Advertencia:** permite guardar, pero solicita revisión.
- **Cálculo:** reduce captura manual y evita diferencias.
- **Sugerencia:** conecta el registro con una decisión posterior.

Los rangos orientativos deben revisarse con especialistas locales y, cuando corresponda, convertirse en parámetros configurables.
