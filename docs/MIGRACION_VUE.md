# Guía de migración de módulos a Vue 3

## Estado

`App.vue`, sidebar, topbar, dashboard, tarjetas y navegación son Vue 3. Los módulos originales viven en `src/renderer/public/legacy` y se montan mediante `LegacyModuleView.vue`.

## Objetivo por módulo

Cada módulo debe terminar en:

```text
src/renderer/src/features/<modulo>/
  components/
  composables/
  views/
  services.js
  validators.js
  __tests__/
```

## Procedimiento seguro

1. Documentar el flujo y capturar casos de regresión.
2. Extraer consultas a métodos existentes de `window.api`.
3. Mover validaciones puras a `validators.js` y probarlas.
4. Crear componentes Vue pequeños antes de la vista completa.
5. Mantener el mismo esquema y nombres de campos.
6. Comparar creación, edición, eliminación, filtros y exportación.
7. Reemplazar el registro en `LegacyModuleView` por la vista Vue.
8. Eliminar el archivo heredado solo después de aprobar pruebas.

## Primer orden recomendado

1. Finca: flujo pequeño y sirve como patrón.
2. Lotes: entidad maestra con relaciones.
3. Cosecha: operación diaria crítica.
4. Beneficio e inventario: flujo automático relacionado.
5. Gastos y reportes.
6. Módulos complementarios.

## Criterios de terminado

- Sin manipulación directa del DOM.
- Sin `onclick` inline.
- Estado y efectos gestionados por Vue.
- Validación accesible y mensajes claros.
- Pruebas unitarias y de componente.
- Atajos de menú liberan listeners al desmontar.
- Comportamiento equivalente o mejor al módulo heredado.
