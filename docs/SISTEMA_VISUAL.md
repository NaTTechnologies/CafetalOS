# Sistema visual y experiencia de uso

## Concepto

La identidad visual une el cultivo del café con la tecnología:

- hojas verdes para crecimiento y manejo agronómico;
- cerezas rojas para cosecha y calidad;
- circuitos para datos, automatización y trazabilidad;
- superficies pergamino para lectura prolongada;
- verdes profundos para navegación y confianza.

El logo oficial y sus derivados se documentan en [`IDENTIDAD_VISUAL.md`](IDENTIDAD_VISUAL.md).

## Tokens

Los tokens viven en `src/renderer/src/assets/styles/tokens.css`:

- `--ink-*`: navegación, encabezados y contraste;
- `--leaf-*`: éxito, sostenibilidad y acciones positivas;
- `--earth-*`: café, proceso y costos;
- `--gold-*`: cosecha, demo y énfasis;
- `--cherry-*`: alertas y estados críticos;
- `--paper`, `--canvas`, `--line`: superficies y separación.

Los componentes nuevos deben usar tokens semánticos. No se recomienda introducir colores hexadecimales aislados cuando ya existe una variable equivalente.

## Patrones de interfaz

- Sidebar agrupado por **Operación**, **Inteligencia** y **Comunidad**.
- Contexto de página siempre visible en la barra superior.
- Dashboard orientado a tareas y decisiones.
- Una acción primaria clara por vista.
- Tablas dentro de contenedores con encabezado contrastado.
- Indicador explícito para distinguir producción de demo.
- Mensajes de error dentro del flujo, no únicamente en diálogos del sistema.
- Responsive progresivo con drawer móvil y tablas tipo tarjeta.

## Flujos optimizados

### Registro diario

Resumen → Registrar corte → seleccionar lote y recolector → guardar → revisar cosecha.

### Transformación

Cosecha → Beneficio → inventario → calidad → trazabilidad.

### Decisión económica

Gastos + inventario + producción → reportes → rentabilidad por lote y período.

### Historia del origen

Lote → cosecha → beneficio → calidad → código de trazabilidad.

## Accesibilidad

- HTML en español de Honduras.
- Navegación principal con `aria-current`.
- Etiquetas accesibles para controles del shell.
- Contraste alto en navegación y encabezados.
- Soporte de teclado en búsqueda y grupos.
- Preferencia `prefers-reduced-motion` respetada.
- Tablas móviles con etiquetas derivadas de sus encabezados.

Pendientes:

- navegación completa por teclado dentro de módulos heredados;
- eliminación progresiva de handlers inline;
- gestión de foco en todos los modales heredados;
- pruebas automatizadas de contraste y lector de pantalla.
