# Datos demo

La demo representa **Finca El Sabanero**, una operación ficticia de Santa Bárbara, Honduras. Está diseñada para recorrer la aplicación completa sin utilizar información real.

## Ejecutar en Windows

```bat
demo.bat
```

## Ejecutar desde terminal

```bash
npm run demo:reset
```

El comando regenera `database/cafetal-os-demo.db` y abre Electron con `--demo --reset-demo`. La aplicación copia la plantilla a `cafetal-os-demo-runtime.db` dentro de `userData`; la base de producción nunca se modifica.

## Contenido aproximado

- 1 finca, 8 lotes y 20 recolectores entre semillas y registros adicionales;
- cinco años de cosechas estacionales;
- más de 80 procesos de beneficio;
- inventario, ventas y más de 400 gastos;
- huella de carbono y prácticas regenerativas;
- evaluaciones SCA con notas de catación;
- códigos de origen y cadena hash verificable;
- cartera de compradores, campañas y fidelización;
- 365 días de clima y alertas de roya, broca, sequía e inundación;
- precios, benchmarks, perfiles de sabor y contenido educativo.

## Conservar cambios de una sesión demo

```bash
npm run dev -- --demo
```

Ese modo utiliza la copia demo existente sin restablecerla. Para volver al estado inicial ejecute nuevamente `npm run demo:reset`.

## Regenerar solo la base

```bash
npm run demo:generate
```

La prueba `tests/unit/demo-integrity.spec.js` verifica que todos los módulos tengan datos y que la cadena de trazabilidad sea continua.

## Activación desde Configuración

La demo puede restaurarse sin cerrar la aplicación desde **Configuración → Datos y demo → Cargar demo completa**. Esta operación requiere rol Administrador y reemplaza únicamente `cafetal-os-demo-runtime.db`.

Los usuarios se almacenan fuera de la base demo; por ello las cuentas no se pierden al restaurarla.
