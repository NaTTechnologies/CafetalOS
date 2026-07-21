# Configuración, base productiva y demostración

El panel **Configuración** es una vista Vue 3 nativa accesible desde el menú lateral, el menú de usuario, el indicador de base de datos o `Ctrl/Cmd + ,`.

## Bases separadas

Cafetal OS mantiene dos archivos de trabajo independientes dentro de `userData`:

| Modo | Archivo | Uso |
|---|---|---|
| Producción | `cafetal-os.db` | Información real de la finca. |
| Demo | `cafetal-os-demo-runtime.db` | Datos ficticios para capacitación y evaluación. |

Los archivos incluidos en `database/` funcionan como plantillas. La aplicación nunca escribe directamente sobre ellos durante el uso normal.

## Cargar la demo desde la aplicación

1. Inicie sesión como administrador.
2. Abra **Configuración → Datos y demo**.
3. Pulse **Cargar demo completa**.
4. Confirme la operación.

La aplicación:

1. guarda la base activa;
2. cierra la instancia SQL.js;
3. reemplaza la copia runtime demo por `database/cafetal-os-demo.db`;
4. abre la nueva base;
5. recarga el renderer para que todos los módulos consulten la demo.

La operación no modifica la base productiva.

## Volver a producción

En el mismo panel pulse **Abrir base productiva**. La demo permanece guardada para una sesión posterior.

## Restablecer la demostración

Pulsar **Cargar demo completa** mientras el modo demo está activo descarta los cambios realizados sobre la copia demo y vuelve al estado distribuido con el repositorio.

## Respaldo

El botón **Crear respaldo** copia la base activa a:

```text
Documentos/CafetalOS/Respaldos/cafetal-os_<modo>_<fecha>.db
```

Se recomienda crear un respaldo antes de importar datos, eliminar registros en volumen o actualizar de versión.

## Scripts compatibles

Los scripts tradicionales continúan disponibles:

```bash
npm run demo
npm run demo:reset
```

En Windows:

```bat
demo.bat
```

Estos scripts son útiles en desarrollo y CI. Para usuarios finales se recomienda el panel interno.
