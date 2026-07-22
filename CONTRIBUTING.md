# Contribuir a Cafetal OS

Gracias por ayudar a construir tecnología abierta para la cadena del café. Cafetal OS acepta contribuciones de productores, técnicos, catadores, diseñadores, documentadores y desarrolladores.

## Antes de comenzar

1. Lea el [Código de conducta](CODE_OF_CONDUCT.md).
2. Revise el [Roadmap](docs/ROADMAP.md) y los issues existentes.
3. No comparta bases reales, respaldos, nombres de trabajadores, teléfonos, coordenadas precisas ni documentos de certificación.
4. Use la base demo para reproducir errores y preparar capturas.

## Formas de contribuir

### Desde el campo

Puede aportar sin escribir código:

- describiendo un flujo real de cosecha, beneficio o inventario;
- señalando términos que no sean naturales para productores;
- revisando unidades, rendimientos y prácticas agrícolas;
- proponiendo información educativa;
- validando la interfaz en computadoras pequeñas;
- reportando obstáculos de conectividad, capacitación o accesibilidad.

Una propuesta funcional debe explicar:

1. quién enfrenta el problema;
2. en qué momento ocurre;
3. qué información existe;
4. qué decisión se necesita tomar;
5. qué resultado debería producir el sistema.

### Documentación y diseño

- Corrija manuales y ejemplos.
- Agregue diagramas propios o con licencia compatible.
- Mejore textos para español claro.
- Pruebe contraste, navegación por teclado y layouts móviles.
- Mantenga las capturas con datos ficticios.

### Código

- Corrija errores reproducibles.
- Agregue pruebas antes de refactorizar.
- Migre módulos de `public/legacy` a componentes Vue 3.
- Mantenga el contrato seguro entre renderer y proceso principal.
- Documente cualquier cambio de base de datos.

## Preparar el entorno

```bash
git clone <repositorio>
cd cafetal-os
npm ci
npx install-electron --no
npm run dev
```

Credenciales locales iniciales:

```text
admin / admin
```

Cambie la contraseña antes de usar datos propios.

## Flujo de trabajo recomendado

1. Cree un fork.
2. Cree una rama corta y descriptiva:

```bash
git checkout -b fix/scroll-beneficio
git checkout -b feat/cosecha-pagos
```

3. Desarrolle con datos demo.
4. Agregue o actualice pruebas.
5. Ejecute la validación local:

```bash
npm test
npm run lint
npm run verify
npm run build:app
```

6. Cuando cambie una interfaz, regenere capturas:

```bash
npm run screenshots
```

7. Abra un pull request pequeño y explicativo.

## Convenciones técnicas

### Vue y renderer

- Nuevas interfaces deben implementarse como componentes Vue 3.
- Evite agregar funcionalidades nuevas a `src/renderer/public/legacy/`; esa carpeta solo recibe correcciones necesarias mientras se migra.
- No acceda a Node.js directamente desde Vue.
- Use `window.api` y métodos definidos en el preload.
- Diseñe primero para 360, 430, 768, 1024 y 1440 píxeles.
- Todo control debe tener nombre accesible y estado visible.

### Electron y seguridad

- Mantenga `contextIsolation: true`.
- Mantenga `nodeIntegration: false`.
- Mantenga sandbox y `webSecurity` activos.
- No exponga un canal IPC genérico.
- Valide autorización en el proceso principal, no solo en la interfaz.
- Los enlaces externos deben limitarse a protocolos permitidos.

### Base de datos

- Use consultas parametrizadas.
- Los cambios de esquema deben ser idempotentes.
- Incluya migración y estrategia de reversión.
- No modifique la plantilla productiva con datos demo.
- Agregue una prueba de integridad cuando cambie tablas o semillas.

### Estilo y calidad

- Español claro en la interfaz.
- Nombres técnicos en inglés o español según el contexto ya establecido, sin mezclar arbitrariamente.
- Funciones pequeñas y responsabilidades explícitas.
- Sin secretos, tokens ni datos personales en commits.
- Sin archivos generados `node_modules`, `out`, `dist`, respaldos o bases runtime.

## Pruebas mínimas por tipo de cambio

| Cambio | Pruebas esperadas |
|---|---|
| Lógica pura | Vitest unitario. |
| Componente Vue | Vue Test Utils + accesibilidad básica. |
| Preload/IPC | Prueba de contrato y autorización. |
| Base de datos | Integridad, migración y demo. |
| Flujo crítico | Playwright Electron. |
| Cambio visual | Capturas desktop y móvil. |

## Pull requests

Incluya:

- problema observado;
- solución implementada;
- evidencia de pruebas;
- capturas antes/después cuando aplique;
- impacto en base de datos;
- impacto en usuarios existentes;
- limitaciones conocidas.

Un pull request puede ser rechazado temporalmente si mezcla demasiados temas, no tiene evidencia o contiene información privada.

## Reportar errores

Use la plantilla de bug e incluya:

- versión de Cafetal OS;
- sistema operativo;
- versión de Node;
- pasos exactos;
- resultado esperado;
- resultado actual;
- logs relevantes;
- captura con datos ficticios.

Para errores de capturas, adjunte `test-results/.../error-context.md` y el contenido visible de la consola.

## Reconocimiento

Las contribuciones aceptadas pueden aparecer en notas de versión y documentación comunitaria. No se exige cesión de derechos adicional: cada contribución se publica bajo la licencia del repositorio.

## Contribuciones al servidor MCP

El MCP local es una frontera de seguridad y de compatibilidad. Una nueva tool debe:

1. resolver una necesidad de dominio concreta, no exponer SQL libre;
2. tener un nombre estable con prefijo `cafetal_`;
3. definir `inputSchema` cerrado con `additionalProperties: false`;
4. devolver JSON estructurado y comprensible;
5. operar en solo lectura salvo que exista una justificación explícita;
6. validar referencias, fechas, rangos y permisos antes de escribir;
7. incluir prueba unitaria y actualización de `docs/MCP_IA_LOCAL.md`;
8. evitar acceso a usuarios, contraseñas, tokens o archivos ajenos a la finca.

Para comprobar el servidor:

```bash
npm run build:app
npm run mcp:inspect
```

No escriba mensajes de diagnóstico en `stdout`: el transporte stdio reserva ese canal para JSON-RPC. Use `stderr`.

## Contribuciones a formularios inteligentes

Una mejora de formulario debe reducir errores o ayudar a tomar una decisión. No agregue campos únicamente porque existan columnas en la base.

Para cada flujo considere:

- datos mínimos para completar la tarea;
- valores que pueden calcularse automáticamente;
- reglas cruzadas entre campos;
- advertencias que no deben bloquear el registro;
- errores objetivos que sí deben impedir persistencia;
- mensajes naturales para una persona cafetalera;
- validación equivalente en `src/main/domain-validation.js`.

Los rangos agronómicos deben documentar su origen o declararse configurables. Evite presentar una recomendación orientativa como diagnóstico profesional.

## Contribuciones a reportes PDF

Los reportes deben respetar la identidad configurada, márgenes imprimibles, numeración y legibilidad en tamaño carta. Al modificar el generador:

- pruebe documentos de una y varias páginas;
- pruebe con y sin logotipo;
- pruebe textos largos, caracteres españoles y listas;
- no inserte rutas locales ni datos técnicos en el contenido visible;
- conserve metadatos y pie institucional;
- genere el PDF de prueba desde **Configuración → Reportes y membrete**.

## Contribuciones a planillas de corte

La planilla semanal representa una práctica de campo, no una hoja contable genérica. Una modificación debe preservar:

- fila por cortador;
- columna por día y fecha;
- lote y semana únicos;
- unidad original y conversión a kg;
- precio, total y pago;
- actualización sin duplicados;
- transacción completa.

Incluya casos de cinco, seis y siete días, una persona sin corte, valores cero y edición de una semana existente.

## Contribuciones a registro masivo

Una entidad nueva debe publicar solo los campos necesarios. Debe incluir:

1. definición visual y listas relacionadas;
2. normalización y validación de dominio;
3. validación de relaciones;
4. detección de duplicados dentro del bloque;
5. persistencia transaccional;
6. prueba de rollback;
7. documentación de efectos derivados.

No implemente “guardar filas válidas e ignorar errores” como comportamiento predeterminado: puede producir bloques incompletos difíciles de auditar.

## Contribuciones a compras y acopio

Las propuestas deben distinguir:

- proveedor comercial;
- origen físico;
- estado del café;
- peso y unidad comercial;
- control de humedad/defectos;
- decisión de calidad;
- inventario resultante;
- transformación posterior;
- costo de origen.

No reutilice el lote agronómico como lote físico sin documentar la razón. La ruta futura es separar lotes de recepción, transformación y venta.

## Contribuciones educativas

Una lección debe incluir audiencia, objetivo, contenido práctico, fuente y evaluación. El lenguaje debe ser claro para productores y trabajadores, y cualquier recomendación técnica debe diferenciar orientación general de una exigencia legal, contractual o agronómica.
