# Capturas de pantalla con Playwright

La galería visual documenta el estado real de Cafetal OS usando la base demo. Se genera automáticamente en escritorio y móvil.

## Ejecutar

Windows:

```bat
capturar-pantallas.bat
```

Terminal:

```bash
npm run screenshots
```

Depuración:

```bash
npm run screenshots:debug
```

No use `npx run screenshots`.

## Proceso

1. limpia resultados temporales;
2. regenera la demo;
3. compila main, preload y renderer;
4. verifica el bundle y Electron;
5. abre un perfil temporal;
6. captura login;
7. inicia sesión con `admin` / `admin`;
8. recorre módulos;
9. captura configuración y diálogos operativos;
10. repite a 430 × 900.

## Resoluciones

- Desktop: `1600 × 1000`.
- Móvil: `430 × 900`.

## Archivos principales

| Archivo | Interfaz |
|---|---|
| `00-inicio-sesion.png` | Acceso local. |
| `01-resumen.png` | Dashboard. |
| `02-mi-finca.png` | Finca. |
| `03-lotes.png` | Parcelas. |
| `04-cosecha.png` | Corte y cuadrillas. |
| `05-compras-cafe.png` | Compras y acopio. |
| `06-beneficio.png` | Transformación. |
| `07-inventario.png` | Existencias. |
| `08-gastos.png` | Costos. |
| `09-reportes.png` | Informes. |
| `10-sostenibilidad.png` | Prácticas y huella. |
| `11-calidad.png` | Catación. |
| `12-trazabilidad.png` | Origen. |
| `13-predictivo.png` | Indicadores orientativos. |
| `14-mercado.png` | Precios. |
| `15-clima.png` | Clima y alertas. |
| `16-marketing.png` | Clientes y campañas. |
| `17-perfiles-cafe.png` | Perfiles sensoriales. |
| `18-educacion.png` | Centro interactivo. |
| `19-ayuda.png` | Ayuda responsive. |
| `20-configuracion-datos.png` | Base y demo. |
| `21-configuracion-operacion.png` | Perfil operativo. |
| `22-configuracion-membrete.png` | Identidad PDF. |
| `23-configuracion-mcp.png` | IA local. |
| `24-configuracion-cuenta.png` | Cuenta. |
| `25-configuracion-usuarios.png` | Usuarios. |
| `26-configuracion-proyecto.png` | Proyecto abierto. |
| `27-planilla-semanal.png` | Matriz por cortador/día. |
| `27-registro-masivo-lotes.png` | Carga de parcelas. |
| `27-registro-masivo-compras.png` | Recepciones por filas. |

Móvil agrega `00-menu-lateral.png`.

## Esperas visuales

La prueba espera:

- fuentes listas;
- imágenes completas;
- contenido del módulo cargado;
- atributos `data-page` y `aria-label` correctos;
- animaciones desactivadas;
- scroll al inicio.

## Errores frecuentes

### `firstWindow` excede el tiempo

Electron terminó antes de crear la ventana. Revise la salida capturada, `out/main/index.js`, el binario de Electron y el perfil temporal.

### Selector ambiguo

Use nombres accesibles exactos o selectores estables. No anide botones con nombres que contengan la etiqueta de un campo.

### Un elemento intercepta el clic

Revise geometría, z-index y área interactiva. No use `force: true` como solución por defecto; puede ocultar un error real de interfaz.

### Galería desactualizada

El script elimina `IMG/desktop` e `IMG/mobile`, pero conserva `IMG/referencias`.

## Uso en pull requests

Cuando cambie una interfaz:

1. regenere las capturas;
2. incluya imágenes relevantes antes/después;
3. confirme desktop y móvil;
4. no incluya datos productivos;
5. revise que texto y controles no queden cortados.
