# Identidad visual de Cafetal OS

## Concepto

La identidad combina tres elementos:

1. **Hojas de cafeto:** origen agrícola y crecimiento.
2. **Cerezas maduras:** calidad, cosecha y valor del fruto.
3. **Circuitos:** tecnología aplicada al campo y trazabilidad de datos.

El nombre oficial se escribe **Cafetal OS**, respetando el espacio y las mayúsculas. En nombres técnicos se utiliza `cafetal-os`.

## Archivos oficiales

```text
branding/cafetal-os-logo-original.png  archivo suministrado, conservado como referencia
branding/cafetal-os-logo-clean.png     versión recortada con transparencia
branding/cafetal-os-app-icon.png       composición cuadrada para interfaz y repositorio
build/icon.png                         icono de empaquetado en PNG
build/icon.ico                         icono de Windows
build/icon.svg                         versión vectorial simplificada para recursos técnicos
src/renderer/src/assets/cafetal-os-logo.png
src/renderer/public/cafetal-os-logo.png
```

No elimine el archivo original. Los derivados pueden regenerarse, pero deben conservar proporciones, colores y legibilidad.

## Uso en la aplicación

- Sidebar: icono sobre superficie clara para preservar contraste.
- Inicio de sesión: icono acompañado del nombre completo.
- Ventana e instaladores: derivados cuadrados de `build/`.
- README: `branding/cafetal-os-app-icon.png`.

## Área de protección

Mantenga alrededor del símbolo un margen mínimo equivalente al diámetro de una cereza del logo. No permita que texto, bordes o iconos se superpongan con las hojas o circuitos.

## Tamaños mínimos recomendados

- Icono de aplicación: 32 × 32 px.
- Símbolo en sidebar: 34 × 34 px visibles.
- Encabezados y documentación: 96 px o más.
- Impresión: valide manualmente el detalle de los circuitos antes de usar tamaños pequeños.

## Colores de interfaz

La interfaz usa una paleta inspirada en cafetal, suelo, pergamino y cereza:

- Verde profundo: navegación y superficies de alta jerarquía.
- Verde hoja: acciones positivas y estados productivos.
- Pergamino: fondos cálidos y áreas de lectura.
- Dorado: llamadas de atención y datos demo.
- Rojo cereza: alertas críticas o identidad puntual.
- Café tierra: texto secundario y acentos de origen.

Los tokens están definidos en `src/renderer/src/assets/styles/tokens.css`. No copie valores hexadecimales en componentes nuevos cuando exista un token semántico.

## Accesibilidad

- No use color como único indicador de estado.
- Mantenga texto o iconografía junto a alertas y etiquetas.
- Verifique contraste en botones, tablas y badges.
- Incluya texto alternativo cuando el logo aporte significado.
- Use `alt=""` cuando el símbolo sea decorativo y el nombre ya esté visible al lado.

## Usos no permitidos

- Deformar el logo.
- Cambiar de forma independiente los colores de hojas, cerezas o circuitos.
- Añadir sombras intensas o fondos que oculten el contorno.
- Colocar el símbolo sobre imágenes sin contraste.
- Presentar una variante modificada como logo oficial sin revisión comunitaria.

## Código y marca

La licencia MIT cubre el código y los archivos expresamente incluidos en el repositorio. El uso público del nombre y del logo debe evitar confusión sobre respaldo oficial, certificación o autoría. Los forks deben indicar claramente cuando son una variante no oficial si cambian sustancialmente la experiencia o el propósito del proyecto.
