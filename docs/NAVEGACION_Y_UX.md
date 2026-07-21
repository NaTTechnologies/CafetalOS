# Navegación, búsqueda y desplazamiento interno

## Modelo de scroll

La ventana utiliza dos contenedores desplazables independientes:

1. `.nav-groups`: desplaza únicamente los grupos del menú lateral.
2. `.workspace-content`: desplaza el módulo activo sin mover la barra superior ni el menú.

Los contenedores tienen `min-height: 0`, `overflow-y: auto`, `overscroll-behavior: contain` y `scrollbar-gutter: stable`. Los módulos heredados anulan su antiguo `page-body` interno para evitar scroll anidado defectuoso.

Esto corrige los casos en que el scroll lateral desaparecía al abrir Beneficio u otros módulos y evita que una tabla larga amplíe la ventana completa.

## Colapsar el menú lateral

El botón inferior alterna entre:

- ancho expandido de `252px`;
- ancho compacto de `76px` con iconos y tooltips.

La preferencia se conserva en `localStorage` bajo `cafetalos.sidebar.collapsed`.

## Colapsar grupos

Cada encabezado —Operación, Inteligencia y Comunidad— puede contraerse de forma independiente. El estado se guarda en `cafetalos.sidebar.groups`.

Al navegar a una opción de un grupo contraído, Cafetal OS lo expande automáticamente para mantener visible la ubicación actual.

## Buscar módulos

El campo superior busca por:

- nombre del módulo;
- descripción;
- grupo de navegación.

Atajos y teclado:

| Acción | Tecla |
|---|---|
| Enfocar búsqueda | `Ctrl/Cmd + K` |
| Siguiente resultado | `↓` |
| Resultado anterior | `↑` |
| Abrir resultado | `Enter` |
| Cerrar | `Escape` |

Los resultados utilizan roles ARIA `listbox` y `option`, y también funcionan con ratón.
