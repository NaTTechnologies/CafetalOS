# Galería de interfaces de Cafetal OS

Esta carpeta documenta visualmente Cafetal OS con la **base demostrativa** activa. Las imágenes numeradas se generan con Playwright sobre la aplicación Electron compilada.

## Estructura

```text
IMG/referencias/ capturas históricas conservadas para el README
IMG/desktop/    vistas de escritorio, 1600 × 1000
IMG/mobile/     vistas responsive, 430 × 900
```

Las imágenes de `IMG/referencias/` fueron suministradas durante el rediseño inicial y no son eliminadas por la automatización. La galería `00`–`22` representa la versión actual después de ejecutar Playwright.

## Regenerar todas las capturas

```bash
npm run screenshots
```

En Windows:

```bat
capturar-pantallas.bat
```

El proceso regenera la demo, compila la aplicación, valida el bundle, inicia Electron con un perfil temporal e ingresa con `admin` / `admin`.

## Interfaces documentadas

| Archivo | Interfaz | Propósito |
|---|---|---|
| `00-inicio-sesion.png` | Inicio de sesión | Acceso local de usuarios. |
| `01-resumen.png` | Resumen | Indicadores, producción, inventario y alertas. |
| `02-mi-finca.png` | Mi finca | Información general y certificaciones. |
| `03-lotes.png` | Lotes | Parcelas, variedades, altitud y estado. |
| `04-cosecha.png` | Cosecha | Cortes diarios, recolectores y costos. |
| `05-beneficio.png` | Beneficio | Procesamiento, secado, humedad y rendimiento. |
| `06-inventario.png` | Inventario | Existencias y movimientos. |
| `07-gastos.png` | Gastos | Costos por fecha, categoría y lote. |
| `08-reportes.png` | Reportes | Producción, costos y rentabilidad. |
| `09-sostenibilidad.png` | Sostenibilidad | Prácticas, huella y certificaciones. |
| `10-calidad.png` | Calidad | Cataciones y atributos sensoriales. |
| `11-trazabilidad.png` | Trazabilidad | Cadena de origen y verificación. |
| `12-predictivo.png` | Predictivo | Estimaciones y señales agronómicas. |
| `13-mercado.png` | Mercado | Precios y referencias comerciales. |
| `14-clima.png` | Clima | Registros y alertas fitosanitarias. |
| `15-marketing.png` | Marketing | Clientes, campañas y fidelización. |
| `16-perfiles-cafe.png` | Perfiles de café | Perfiles sensoriales y recomendaciones. |
| `17-educacion.png` | Educación | Guías y orientación para el caficultor. |
| `18-ayuda.png` | Ayuda | Manual, preguntas y atajos. |
| `19-configuracion-datos.png` | Datos y demo | Cambio de base, restauración y respaldo. |
| `20-configuracion-cuenta.png` | Mi cuenta | Usuario, nombre y contraseña. |
| `21-configuracion-usuarios.png` | Usuarios | Cuentas, roles y estado. |
| `22-configuracion-proyecto.png` | Proyecto abierto | Documentación, licencia y contribución. |

La galería móvil agrega `00-menu-lateral.png`, que muestra el drawer responsive abierto.

## Convenciones

- Los datos son ficticios.
- Las animaciones se desactivan durante la captura.
- El contenido se coloca al inicio de su scroll antes de guardar la imagen.
- Desktop y móvil se generan en la misma ejecución para detectar regresiones responsive.
- Las trazas de error no se guardan en esta carpeta; se encuentran en `test-results/` y `playwright-report/`.

## Uso en GitHub

El README principal muestra capturas de referencia para que una persona pueda comprender el sistema antes de instalarlo. Las imágenes numeradas pueden añadirse a documentación de módulos, releases y material de capacitación.
