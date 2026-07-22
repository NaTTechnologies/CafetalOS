# Configuración, demo y perfil operativo

## Datos y demo

La sección **Configuración → Datos y demo** permite:

- consultar el archivo activo;
- cargar o restablecer la demo;
- regresar a producción;
- crear un respaldo;
- verificar versión y modo.

La demo runtime y producción son archivos separados. Restablecer la demo no modifica la base productiva.

## Perfil operativo

La pestaña **Perfil operativo** configura cómo entra el café a la organización.

### Productor

Para fincas que cultivan y cosechan su propia materia prima. El flujo recomendado prioriza lotes, cuadrillas, planillas, beneficio y costos por lote.

### Comprador / beneficiador

Para centros de acopio, intermediarios, beneficios o tostadores que reciben café de terceros. El flujo prioriza proveedores, recepción por peso, control de calidad, inventario y transformación.

### Mixta

Combina café propio y comprado.

## Parámetros operativos

- `cosecha_dias_semana`: cinco, seis o siete columnas de día en la planilla.
- `compra_control_calidad`: exige información de calidad antes de aprobar o condicionar compras.
- Temporada activa: aporta unidad, precio y peso predeterminados al crear una semana.

La unidad de campo no sustituye el peso comercial. Lata y canasta se convierten a kilogramos mediante un valor configurable en la planilla.

## Reportes y membrete

La sección permite configurar:

- nombre de organización;
- identificación o RTN;
- dirección;
- teléfono;
- correo;
- web;
- responsable;
- logo;
- colores;
- pie institucional;
- visibilidad del logo.

### Plantillas rápidas

- **Usar datos de la finca:** copia nombre, ubicación y contacto cuando existen.
- **Identidad Cafetal OS:** aplica valores visuales predeterminados para una instalación comunitaria.

Revise y guarde los valores antes de generar el PDF de prueba.

## IA local (MCP)

Muestra:

- ruta del ejecutable;
- argumentos productivos o demo;
- modo lectura/escritura;
- bloque JSON para cliente;
- catálogo de tools.

La interfaz no inicia una conexión de red. El cliente externo controla su propia privacidad.

## Mi cuenta y usuarios

- **Mi cuenta:** nombre, usuario y contraseña.
- **Usuarios:** creación, rol, activación, edición y restablecimiento.

La aplicación impide desactivar o degradar al último administrador activo.

## Proyecto abierto

Incluye versión, licencia, enlaces a documentación y orientación para contribuir.

## Demo 2.6.0

La demostración contiene datos ficticios de:

- finca y lotes;
- temporadas, cuadrillas y planillas;
- compras y proveedores;
- beneficio e inventario;
- gastos, calidad y sostenibilidad;
- 365 lecturas climáticas enriquecidas con temperatura, humedad y presión;
- una respuesta climática de demostración en caché para probar el modo offline;
- trazabilidad y mercado;
- progreso educativo.

Puede regenerarse con:

```bash
npm run demo:generate
```

Y abrirse con:

```bash
npm run demo:reset
```
