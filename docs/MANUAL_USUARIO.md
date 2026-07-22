# Manual de usuario

## 1. Primer inicio

Cafetal OS crea sus archivos de trabajo dentro del directorio de datos de Electron. La base incluida en el repositorio es una plantilla; no se modifica durante el uso normal.

Credenciales iniciales:

```text
Usuario: admin
Contraseña: admin
```

Cambie la contraseña en **Configuración → Mi cuenta**.

El encabezado identifica el modo:

- **Base local:** operación productiva.
- **Datos demo:** información ficticia y reiniciable.

## 2. Elegir el perfil operativo

Abra **Configuración → Perfil operativo** y seleccione:

- **Productor:** trabaja principalmente con café originado en su finca.
- **Comprador / beneficiador:** recibe café de terceros y continúa la transformación.
- **Mixta:** combina ambos orígenes.

También puede definir cinco, seis o siete días para la planilla semanal y exigir control de calidad antes de incorporar compras al inventario.

## 3. Flujo para café propio

1. Complete **Mi finca**.
2. Registre lotes individualmente o con **Planificar lotes**.
3. Cree los cortadores.
4. Abra **Cosecha → Planilla semanal**.
5. Seleccione lote, semana, unidad, precio y peso de referencia.
6. Ingrese la cantidad de cada persona por día.
7. Registre el proceso en **Beneficio**.
8. Controle inventario, gastos y ventas.
9. Registre calidad, sostenibilidad, clima y trazabilidad.
10. Revise reportes y seguimiento por semana de corte.

## 4. Planilla semanal de cortadores

La matriz usa una fila por persona y una columna por día. La cabecera muestra el nombre del día y la fecha real.

### Preparación

1. Cree la temporada en la planilla o mediante la API correspondiente.
2. Defina unidad de trabajo: lata, canasta o kg.
3. Defina precio por unidad y peso de referencia.
4. Seleccione el lote.

### Captura

- Escriba cero o deje vacío cuando no exista corte.
- El sistema calcula total por cortador, total diario, kilos y pago.
- Guardar nuevamente la misma semana actualiza la planilla; no la duplica.
- Una cantidad negativa o un cortador inválido cancela todo el guardado.

Consulte [Planillas de corte](PLANILLAS_CORTE.md).

## 5. Registro masivo

Los módulos compatibles muestran un botón como **Registro masivo**, **Cortes por filas**, **Procesos masivos** o **Compras masivas**.

### Procedimiento

1. Abra la tabla.
2. Agregue filas o use **Pegar desde Excel**.
3. Complete listas relacionadas mediante los desplegables.
4. Pulse **Validar**.
5. Corrija las filas con error.
6. Pulse **Guardar todos**.

El guardado es atómico: una fila inválida impide guardar el bloque completo.

Módulos disponibles:

- lotes;
- cortadores y cosecha;
- beneficio;
- inventario;
- gastos;
- proveedores y compras;
- clima;
- calidad.

Consulte [Registro masivo](REGISTRO_MASIVO.md).

## 6. Flujo para compras y acopio

### Crear proveedor

Abra **Compras de café → Nuevo proveedor**. Registre nombre, código, identificación, teléfono, ubicación y datos de finca cuando correspondan.

### Registrar recepción

1. Pulse **Nueva compra** o **Compras masivas**.
2. Seleccione proveedor.
3. Indique fecha, producto y peso.
4. Registre precio por kg o por qq.
5. Documente origen, lote del proveedor y comprobante.
6. Deje la compra pendiente hasta revisar calidad cuando aplique.

Productos admitidos:

- cereza;
- pergamino húmedo;
- pergamino seco;
- verde/oro;
- tostado.

### Revisar calidad

Use la acción de laboratorio para registrar:

- humedad;
- defectos;
- observaciones;
- decisión: aprobada, condicionada o rechazada.

Una compra aprobada o condicionada crea una entrada de inventario. Una compra que ya generó inventario no puede rechazarse sin una reversión controlada.

### Enviar a beneficio

Cereza y pergamino húmedo pueden enviarse a beneficio. El sistema vincula la compra, registra la transformación y evita procesarla dos veces.

Consulte [Compras y acopio](COMPRAS_ACOPIO.md).

## 7. Beneficio, ventas e inventario

### Beneficio

Registre:

- origen propio o comprado;
- kilos ingresados;
- método;
- fermentación;
- secado;
- humedad;
- pergamino obtenido.

Un proceso con pergamino seco crea una entrada relacionada en inventario.

### Ventas de café

Abra **Ventas de café** para registrar cliente, fecha, factura, producto, origen, peso y precio. El sistema valida el saldo disponible antes de confirmar. Cada venta crea un movimiento en el kardex y alimenta los ingresos de rentabilidad. Al anularla, el movimiento se retira y el saldo se restituye.

### Inventario y kardex

Controla entradas, salidas y ajustes internos. Las ventas se administran desde su módulo propio. El kardex muestra saldo cronológico por producto y origen, mientras las alertas de permanencia ayudan a priorizar revisión, secado, transformación o venta. Consulte [Ventas, kardex y almacenamiento](VENTAS_KARDEX_Y_ALMACENAMIENTO.md).

## 8. Gastos y rentabilidad

Los gastos pueden asociarse a lote, categoría, proveedor y comprobante. El sistema calcula el costo total cuando se proporciona cantidad y costo unitario.

En Cosecha, la tarjeta de seguimiento semanal combina pago de cortadores, transformación, gastos y ventas próximas. El margen mostrado es una referencia operativa, no una liquidación contable definitiva.

## 9. Educación interactiva

El módulo incluye:

- rutas de aprendizaje;
- búsqueda y filtros;
- objetivos y listas prácticas;
- progreso por usuario;
- evaluaciones cortas;
- estado iniciado o completado.

Abra una tarjeta para leer la lección completa. Al avanzar o responder una evaluación, el sistema guarda el progreso local.

## 10. Ayuda responsive

Ayuda se adapta a ventanas pequeñas. En móvil, use el selector o navegación compacta para cambiar tema. Los artículos largos mantienen su propio desplazamiento y los atajos se muestran con texto legible.


## 11. Clima conectado y modo local

Abra **Clima** para consultar las condiciones de la finca.

### Configurar ubicación

Puede usar:

- las coordenadas registradas en **Mi finca**;
- **Mi ubicación**, que solicita permiso al sistema operativo;
- **Buscar lugar**, que consulta Open-Meteo Geocoding al presionar Buscar.

### Consultar datos

El panel muestra temperatura, humedad, presión superficial, lluvia, viento y pronóstico de siete días. Las consultas repetidas durante 30 minutos reutilizan la caché local.

Cuando no hay conexión:

- se muestra la última lectura guardada, si existe;
- se identifica como caché desactualizada;
- permanece disponible **Registro manual** para lecturas de estación o sensor.

Las alertas ambientales de extracción son orientativas y no sustituyen la evaluación en taza. Las alertas fitosanitarias de finca se gestionan por separado.

Consulte [Clima por Open-Meteo](CLIMA_OPEN_METEO.md).

## 12. Reportes y membrete

Abra **Configuración → Reportes y membrete** para definir:

- nombre institucional;
- identificación o RTN;
- dirección y contacto;
- responsable;
- logotipo;
- colores;
- sitio web;
- pie de página.

Puede aplicar una plantilla rápida de finca o de Cafetal OS y generar un PDF de prueba.

## 13. Inteligencia artificial local

En **Configuración → IA local (MCP)** copie la configuración del cliente compatible. El servidor funciona por `stdio`, en solo lectura por defecto.

Las consultas pueden incluir planillas, compras, lotes, cosecha, beneficio, inventario, calidad, finanzas, alertas y reportes.

## 14. Respaldos

Use **Archivo → Crear respaldo** o **Configuración → Datos y demo**. Los respaldos se guardan en:

```text
Documentos/CafetalOS/Respaldos
```

Cree un respaldo antes de:

- actualizar la aplicación;
- usar importaciones masivas;
- abrir una base con una versión nueva;
- corregir inventario histórico;
- automatizar escritura mediante MCP.

## 15. Capturas y documentación visual

Ejecute:

```bash
npm run screenshots
```

Las imágenes se guardan en `IMG/desktop` y `IMG/mobile`. La galería incluye los módulos, configuración, planilla semanal y matrices masivas.

## 16. Solución de problemas

### Electron no inicia

```bash
npx install-electron --no
npm run dev
```

### Capturas fallan

Ejecute:

```bash
node scripts/check-electron.js
npm run screenshots:debug
```

Revise `test-results/.../error-context.md` y la traza generada.

### Un bloque masivo no guarda

Pulse **Validar** y revise cada fila. Recuerde que el sistema no guarda parcialmente.

### Una compra no puede aprobarse

Complete humedad y defectos cuando el control de calidad esté activo. Para pergamino seco y verde, la humedad es obligatoria al aprobar o condicionar.

### Datos incoherentes

No edite directamente el `.db`. Cree un respaldo, reproduzca el caso con la demo y documente la incidencia.
