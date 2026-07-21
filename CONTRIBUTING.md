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
