# Galería de interfaces

Esta carpeta contiene documentación visual reproducible de Cafetal OS.

## Estructura

```text
IMG/
├── desktop/      capturas 1600 × 1000
├── mobile/       capturas 430 × 900
├── referencias/  imágenes históricas preservadas
└── README.md
```

Las carpetas `desktop` y `mobile` se regeneran con:

```bash
npm run screenshots
```

## Módulos

| Archivo | Pantalla |
|---|---|
| `00-inicio-sesion.png` | Inicio de sesión. |
| `01-resumen.png` | KPI, gráficos e indicadores expertos. |
| `02-mi-finca.png` | Datos de finca. |
| `03-lotes.png` | Parcelas. |
| `04-cosecha.png` | Cortes, cuadrillas y planilla semanal. |
| `05-compras-cafe.png` | Proveedores, recepciones y control de calidad. |
| `06-ventas-cafe.png` | Ventas y descarga del inventario. |
| `07-beneficio.png` | Procesamiento. |
| `08-inventario.png` | Existencias, kardex y alertas de almacenamiento. |
| `09-gastos.png` | Costos. |
| `10-reportes.png` | Informes. |
| `11-sostenibilidad.png` | Huella, prácticas y certificaciones. |
| `12-calidad.png` | Catación. |
| `13-trazabilidad.png` | Ruta de origen. |
| `14-predictivo.png` | Señales orientativas. |
| `15-mercado.png` | Precios. |
| `16-clima.png` | Open-Meteo, pronóstico, caché y alertas. |
| `17-marketing.png` | Clientes y campañas. |
| `18-perfiles-cafe.png` | Perfiles sensoriales. |
| `19-educacion.png` | Rutas y progreso. |
| `20-ayuda.png` | Ayuda responsive. |

## Configuración

| Archivo | Pantalla |
|---|---|
| `20-configuracion-datos.png` | Datos, demo y respaldo. |
| `21-configuracion-operacion.png` | Productor, comprador o mixto. |
| `22-configuracion-membrete.png` | Identidad de PDF. |
| `23-configuracion-mcp.png` | Servidor local de IA. |
| `24-configuracion-cuenta.png` | Cuenta actual. |
| `25-configuracion-usuarios.png` | Administración de usuarios. |
| `26-configuracion-proyecto.png` | Información open source. |

## Flujos amplios

| Archivo | Pantalla |
|---|---|
| `27-planilla-semanal.png` | Filas por cortador y columnas por día. |
| `27-registro-masivo-lotes.png` | Captura múltiple de parcelas. |
| `27-registro-masivo-compras.png` | Captura múltiple de recepciones. |

La galería móvil incluye además `00-menu-lateral.png`.

## Reglas para contribuir imágenes

- Use únicamente la demo.
- No incluya personas, teléfonos, ubicaciones precisas ni documentos reales.
- Regenere desktop y móvil cuando cambie un layout.
- Mantenga nombres estables para evitar enlaces rotos.
- No modifique manualmente las imágenes generadas para ocultar defectos visuales.
- Las referencias históricas no se eliminan durante la automatización.
