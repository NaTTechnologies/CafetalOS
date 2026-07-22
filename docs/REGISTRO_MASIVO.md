# Registro masivo

Los formularios individuales son apropiados para correcciones o registros ocasionales. Cuando existe una libreta, hoja de cálculo o lote de documentos, Cafetal OS ofrece una matriz de captura que ocupa casi toda la ventana y guarda el bloque de manera atómica.

## Módulos disponibles

| Módulo | Acción masiva | Relaciones mediante lista |
|---|---|---|
| Mi finca / Lotes | Parcelas | Variedad |
| Cosecha | Cortes y cortadores | Lote y cortador |
| Beneficio | Procesos | Lote |
| Inventario | Entradas, salidas y ventas | Lote |
| Gastos | Costos | Lote |
| Compras de café | Proveedores y recepciones | Proveedor |
| Clima | Mediciones | No aplica |
| Calidad | Cataciones | Lote |

**Mi finca** conserva un único perfil operativo activo. Su acción masiva administra los lotes de esa unidad productiva, evitando crear fincas ambiguas que no podrían asociarse correctamente a los movimientos.

## Uso de la tabla

1. Pulse el botón de registro masivo del módulo.
2. Complete filas manualmente o agregue 10 filas.
3. Use **Pegar desde Excel** para importar texto tabulado.
4. Pulse **Validar**.
5. Corrija las filas marcadas.
6. Pulse **Guardar todos**.

La matriz mantiene cabecera y primera columna visibles, permite desplazamiento horizontal y se convierte en pantalla completa en tamaños móviles.

## Pegar desde Excel

Copie un rango de Excel, LibreOffice Calc o Google Sheets y péguelo en el área correspondiente. Puede incluir encabezados. Cafetal OS:

- detecta encabezados por nombre de campo o etiqueta visible;
- convierte etiquetas de listas, por ejemplo `Producción`, al valor interno correspondiente;
- ignora columnas que exceden la definición visible;
- crea una fila por línea tabulada.

Revise fechas y separadores decimales antes de guardar. Las fechas deben usar `YYYY-MM-DD` para evitar interpretaciones regionales.

## Validación atómica

El renderer muestra resultados por fila, pero el proceso principal vuelve a validar todo. Las reglas incluyen:

- códigos duplicados dentro del bloque y en la base;
- capacidad acumulada de los lotes;
- relaciones activas;
- fechas futuras no permitidas;
- rangos de humedad, catación, clima y rendimiento;
- inventario proyectado para impedir saldos negativos;
- compras aprobadas sin control de calidad requerido;
- consistencia entre cereza y pergamino.

Si una sola fila no es válida, **ninguna fila se guarda**. El proceso utiliza `BEGIN TRANSACTION`, `COMMIT` y `ROLLBACK`.

## Operaciones derivadas

Algunos bloques generan movimientos relacionados:

- un beneficio crea una entrada de pergamino seco;
- una compra aprobada o condicionada crea una entrada de inventario;
- una venta calcula kilogramos y total;
- un gasto calcula cantidad por costo unitario.

## Extender la matriz

Para incorporar otra entidad:

1. agregue la definición visual en `src/renderer/public/legacy/registro-masivo.js`;
2. publique solamente campos permitidos;
3. agregue validación en `domain-validation.js`;
4. habilite la entidad en `normalizeBulkRow`;
5. implemente relaciones y persistencia en `bulk:save`;
6. agregue pruebas unitarias y datos demo;
7. documente las operaciones derivadas.
