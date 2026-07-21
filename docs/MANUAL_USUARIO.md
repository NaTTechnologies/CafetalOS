# Manual de usuario

## 1. Primer inicio

Al abrir Cafetal OS se crea una base local dentro de la carpeta de datos de la aplicación. La base incluida en el repositorio funciona como plantilla y no se modifica durante el uso normal.

El encabezado indica el modo actual:

- **Base local:** datos de producción.
- **Datos demo:** copia ficticia y reiniciable para capacitación.

## 2. Flujo operativo recomendado

1. Complete **Mi finca** con ubicación, altitud, área y contacto.
2. Registre parcelas en **Lotes**, incluyendo código, variedad, área, densidad, exposición, suelo y estado.
3. Cree recolectores y registre cortes diarios en **Cosecha**.
4. En **Beneficio**, documente kilos de cereza, método, fermentación, secado, humedad y pergamino obtenido.
5. Controle entradas, salidas, ajustes y ventas en **Inventario**.
6. Registre costos en **Gastos** para calcular rentabilidad.
7. Revise **Reportes** y compare rendimiento por lote y período.
8. Complete **Calidad**, **Sostenibilidad**, **Clima** y **Trazabilidad** para enriquecer la historia del producto.
9. Use **Mercado**, **Marketing** y **Suscripción** para analizar precios, clientes y recomendaciones de perfil.

## 3. Módulos

### Inicio

Resume lotes activos, área, cosecha mensual, inventario y actividad reciente. Las acciones rápidas abren los flujos más frecuentes.

### Mi finca y lotes

La finca agrupa los lotes. Un lote debe tener un código único dentro de la finca. Desactivar un lote conserva su historial.

### Cosecha

Registra fecha, recolector, latas, peso estimado, madurez, precio y jornada. El peso en kilogramos se utiliza en beneficio y reportes.

### Beneficio

Registra transformación de cereza a pergamino. Cuando existe pergamino seco, el flujo crea una entrada de inventario relacionada.

### Inventario

Muestra movimientos por tipo de producto y lote. Las salidas no deben superar la existencia disponible. Antes de corregir datos históricos, genere un respaldo.

### Gastos y reportes

Los gastos pueden asociarse a un lote y categoría. Los reportes combinan producción, costos e inventario para apoyar decisiones; no sustituyen certificaciones contables, fiscales ni agronómicas.

### Calidad

Guarda evaluación SCA, atributos sensoriales, notas de catación y evaluador, vinculados al lote o proceso de beneficio.

### Sostenibilidad

Registra emisiones estimadas, prácticas regenerativas y certificaciones. Los factores de emisión del demo son ilustrativos y deben configurarse con metodología técnica antes de usarse en declaraciones ambientales.

### Trazabilidad

Relaciona cosecha, beneficio e inventario mediante códigos de origen y una cadena hash local. La cadena ayuda a detectar alteraciones en el registro; no equivale a una blockchain pública ni certifica por sí sola el origen.

### Clima y alertas

Guarda lluvia, temperatura, humedad y viento. Las alertas sirven como bitácora de seguimiento; las recomendaciones no reemplazan asistencia de IHCAFE o un técnico competente.

## 4. Unidades

- `mz`: manzana hondureña usada como unidad de superficie.
- `kg`: kilogramo.
- `qq`: quintal de 46 kg dentro de la aplicación.
- `lata`: unidad operativa cuyo peso estimado se registra en cada corte.
- `msnm`: metros sobre el nivel del mar.

## 5. Respaldos

Use **Archivo → Crear respaldo**. El archivo se guarda en `Documentos/CafetalOS/Respaldos` con fecha, hora y modo. Mantenga al menos una copia adicional fuera del equipo.

Antes de actualizar la aplicación, importar datos o hacer correcciones masivas, cree un respaldo y compruebe que puede copiarse a otro medio.

## 6. Modo demo

En Windows ejecute `demo.bat`. Desde terminal:

```bash
npm run demo:reset
```

Puede modificar la sesión. Al reiniciarla, se restaura la plantilla. La base productiva no se toca.

## 7. Atajos

- `Ctrl/Cmd + N`: nuevo registro en el módulo activo, cuando el módulo lo admite.
- `Ctrl/Cmd + S`: guardar, cuando el módulo lo admite.
- `Ctrl/Cmd + P`: abrir reportes.

## 8. Solución de problemas

- **Pantalla vacía:** ejecute `npm run verify`, `npm ci` y `npm run dev` desde terminal para ver el error.
- **Base demo ausente:** ejecute `npm run demo:generate`.
- **Error de compilación:** confirme Node.js 22.12+ y use el script nativo del sistema.
- **Un módulo no abre:** registre módulo, pasos y error de consola en una incidencia.
- **Datos incoherentes:** no edite directamente el archivo `.db`; cree un respaldo y documente el caso.
- **El instalador no está firmado:** los builds comunitarios locales pueden mostrar advertencias del sistema operativo.

---

## Acceso y usuarios

Al abrir Cafetal OS se muestra el inicio de sesión. En la primera ejecución utilice `admin` / `admin` y cambie la contraseña en **Configuración → Mi cuenta**.

Los administradores pueden crear cuentas adicionales desde **Configuración → Usuarios**. Cada cuenta tiene nombre, usuario, contraseña, rol y estado activo. La aplicación impide dejar el sistema sin un administrador activo.

## Navegación mejorada

- Use el botón inferior del menú para contraer o expandir el sidebar.
- Pulse el encabezado de Operación, Inteligencia o Comunidad para contraer ese grupo.
- Use `Ctrl + K` en Windows/Linux o `Cmd + K` en macOS para buscar un módulo.
- El menú y el panel central se desplazan de manera independiente.

## Cargar datos demo desde la aplicación

1. Abra **Configuración**.
2. Entre a **Datos y demo**.
3. Pulse **Cargar demo completa**.
4. Confirme la restauración.

La base productiva queda intacta. Para regresar, pulse **Abrir base productiva**.

## Configuración

El panel incluye:

- **Datos y demo:** estado de archivos, cambio de base y respaldo.
- **Mi cuenta:** nombre, usuario y contraseña.
- **Usuarios:** disponible para administradores.
- **Proyecto abierto:** documentación, arquitectura, galería y guía de contribución.
