# Reportes PDF y membrete institucional

Los PDF de Cafetal OS usan un membrete configurable desde:

**Configuración → Reportes y membrete**

## Datos configurables

- Nombre de finca, cooperativa u organización.
- RTN, registro o identificación.
- Dirección.
- Teléfono.
- Correo.
- Sitio web.
- Responsable de emisión.
- Logotipo PNG o JPG.
- Color principal y secundario.
- Texto del pie de página.
- Visibilidad del logotipo.

La configuración se valida en la interfaz y nuevamente en el proceso principal antes de guardarse en la tabla `configuracion`. Correos, sitios web, teléfonos, colores y longitudes inválidas se rechazan. El logotipo seleccionado se copia a `userData/report-assets` para evitar depender de una ruta externa que pueda cambiar.

## Estructura del PDF

Cada documento incluye:

- franja de identidad;
- logotipo y datos institucionales;
- título y fecha de emisión;
- responsable cuando está configurado;
- jerarquía de secciones, listas y valores;
- pie institucional;
- versión de Cafetal OS;
- numeración `página/total`;
- metadatos del documento.

## Plantillas rápidas

- **Usar datos de finca:** carga nombre y ubicación disponibles.
- **Aplicar plantilla:** restaura colores, logo y pie comunitario de Cafetal OS.

Las plantillas no inventan RTN, teléfono ni responsable; esos campos deben revisarse manualmente.

## Probar el diseño

Use **Generar PDF de prueba** en la configuración. El documento de prueba permite revisar tipografía, colores, logotipo, encabezado y pie antes de emitir reportes reales.

## API IPC

```js
window.api.config.getAll()
window.api.config.update(values)
window.api.config.selectReportLogo()
window.api.config.clearReportLogo()
window.api.exportar.pdf({ titulo, contenidoHtml })
```

## Compatibilidad

PDFKit admite imágenes PNG y JPEG. Un logotipo SVG debe exportarse primero a PNG para utilizarse en el membrete.


## Recomendaciones de identidad

- Use un logotipo con fondo transparente o blanco y proporción horizontal o cuadrada.
- Mantenga alto contraste entre el color principal y el fondo.
- Registre un responsable de emisión para reportes enviados a compradores, cooperativas o certificadoras.
- Evite incluir datos personales que no sean necesarios.
- Genere el PDF de prueba después de cambiar el logotipo o los colores.
