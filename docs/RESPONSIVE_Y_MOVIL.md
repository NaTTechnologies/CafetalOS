# Arquitectura responsive y evolución móvil

Cafetal OS 2.2 adapta su interfaz desde escritorios amplios hasta ventanas de 360 píxeles. El objetivo actual es que la aplicación Electron siga siendo utilizable cuando la ventana se reduzca; esta base también disminuye el trabajo futuro para una PWA o una aplicación móvil.

## Puntos de quiebre

| Ancho | Comportamiento principal |
|---|---|
| Más de 1050 px | Distribución desktop completa. |
| 861–1050 px | Paneles y estadísticas reducen columnas. |
| 641–860 px | El sidebar se convierte en drawer y aparece la barra móvil. |
| 421–640 px | Formularios, tarjetas y tablas se apilan. |
| Hasta 420 px | Controles compactos y contenido en una sola columna. |

La referencia se encuentra en `src/renderer/src/assets/styles/responsive.css`.

## Navegación móvil

- El sidebar sale del flujo principal y se convierte en un drawer.
- Un backdrop bloquea interacciones con el contenido mientras el drawer está abierto.
- El botón de menú conserva un nombre accesible.
- Al navegar, el drawer se cierra automáticamente.
- El scroll del menú y el scroll del contenido siguen siendo independientes.

## Buscador móvil

En escritorio, el buscador permanece en la barra superior. En móvil, un botón abre una capa de búsqueda de ancho completo. Se mantienen:

- búsqueda por nombre, descripción y grupo;
- navegación con teclado;
- cierre con `Escape`;
- acceso rápido con `Ctrl/Cmd + K`.

## Tablas adaptativas

`LegacyModuleView.vue` agrega a cada tabla:

- la clase `responsive-data-table`;
- un `data-label` por celda, tomado del encabezado;
- foco y nombre accesible al contenedor desplazable.

Por debajo de 640 px, cada fila se representa como una tarjeta. Esto evita obligar al usuario a desplazarse horizontalmente para consultar columnas críticas.

Una tabla que contenga estructuras complejas, celdas combinadas o gráficos puede requerir una adaptación específica en lugar de la transformación automática.

## Formularios y modales

- Las cuadrículas de dos, tres o cuatro columnas pasan a una columna.
- Los encabezados y barras de acciones permiten salto de línea.
- Los campos respetan el ancho disponible.
- Los modales limitan su altura y habilitan scroll interno.
- Los botones prioritarios ocupan el ancho disponible en pantallas muy pequeñas.

## Verificación automatizada

Playwright genera dos galerías:

```text
IMG/desktop/  1600 × 1000
IMG/mobile/    430 × 900
```

La prueba `tests/e2e/electron.spec.js` también verifica que:

- la aplicación detecte el ancho móvil;
- el drawer se abra y cierre;
- el contenido conserve scroll interno;
- el sidebar no pierda su contenedor desplazable.

## Limitaciones actuales

- Electron sigue siendo el entorno de ejecución oficial.
- Los módulos heredados pueden contener estilos inline que necesiten ajustes particulares.
- No existe todavía sincronización remota ni estrategia offline para navegador.
- No se ha implementado navegación basada en URL con Vue Router.
- No se han probado gestos táctiles avanzados ni lectores de códigos desde cámara.

## Ruta hacia PWA

Antes de publicar una PWA se recomienda:

1. separar los casos de uso del proceso Electron;
2. definir una interfaz de repositorio común para SQL.js local y almacenamiento web;
3. reemplazar canales IPC por adaptadores de plataforma;
4. implementar Service Worker, manifiesto web y política de actualización;
5. diseñar sincronización con resolución de conflictos;
6. auditar seguridad, almacenamiento y manejo de respaldos en navegador;
7. ejecutar pruebas de instalación y funcionamiento sin conexión.

## Ruta hacia Android e iOS

Una opción futura es reutilizar el renderer Vue dentro de Capacitor. Antes de hacerlo deben aislarse:

- sistema de archivos y respaldos;
- exportación PDF/Excel;
- almacenamiento de credenciales;
- permisos de cámara y archivos;
- notificaciones;
- actualización de la aplicación;
- sincronización entre dispositivos.

La prioridad arquitectónica es que la lógica del café no dependa de Electron. Cada módulo migrado debe colocar reglas y validaciones en servicios testeables, dejando la vista y el adaptador de plataforma separados.
