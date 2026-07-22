# Catálogo de módulos

## Operación

| Módulo | Función principal | Novedades 2.6.0 | Implementación |
|---|---|---|---|
| Resumen | KPI, actividad, inventario y alertas. | Indicadores excluyen el lote técnico de acopio. | Vue 3 nativo. |
| Mi finca | Datos generales de la unidad productiva. | Perfil operativo productor, comprador o mixto. | Adaptador funcional. |
| Lotes | Parcelas, variedades, área y estado. | Registro masivo, validación acumulada de área y listas de variedad. | Adaptador funcional. |
| Cosecha | Cortes, cuadrillas, kilos y pagos. | Planilla semanal por cortador/día, temporadas, carga masiva y rentabilidad semanal. | Adaptador funcional ampliado. |
| Compras de café | Recepción de materia prima de terceros. | Proveedores, compras por peso, calidad, inventario, acopio y envío a beneficio. | Módulo funcional nuevo. |
| Ventas de café | Salida comercial de producto terminado o materia prima. | Valida existencias, descuenta kardex y permite anulación con restitución. | Módulo funcional nuevo. |
| Beneficio | Fermentación, secado y rendimiento. | Procesos masivos y soporte de origen propio o comprado. | Adaptador funcional ampliado. |
| Inventario | Entradas, salidas, kardex y existencia. | Kardex por producto/origen, saldo cronológico y alertas de permanencia o humedad. | Adaptador funcional ampliado. |
| Gastos | Costos por categoría, lote y período. | Carga masiva y cálculo derivado. | Adaptador funcional ampliado. |

## Inteligencia

| Módulo | Función principal | Estado |
|---|---|---|
| Reportes | Producción, costos y rentabilidad. | PDF con membrete configurable. |
| Sostenibilidad | Emisiones, prácticas y certificaciones. | Validaciones contextuales. |
| Calidad | Cataciones, atributos y puntaje. | Cataciones individuales y masivas. |
| Trazabilidad | Origen, QR y cadena hash local. | Integra lote, cosecha, beneficio e inventario. |
| Predictivo | Estimaciones y señales agronómicas. | Orientativo; requiere revisión técnica. |
| Mercado | Precios y referencias comerciales. | Datos demo identificados como sintéticos. |
| Clima | Condiciones actuales, pronóstico, bitácora y alertas. | Open-Meteo REST, geolocalización, búsqueda manual, caché de 30 minutos, modo offline y registro manual. |

## Comunidad

| Módulo | Función principal | Estado |
|---|---|---|
| Marketing | Clientes, campañas y fidelización. | Adaptador funcional. |
| Perfiles de café | Sabores y recomendaciones. | Adaptador funcional. |
| Educación | Aprendizaje cafetalero. | Rutas, progreso, lectura, evaluación y finalización por usuario. |
| Ayuda | Manual integrado, preguntas y atajos. | Diseño responsive con navegación móvil. |

## Sistema

| Sección | Función principal |
|---|---|
| Datos y demo | Cambiar base, restaurar demo y crear respaldo. |
| Perfil operativo | Seleccionar productor, comprador/beneficiador o mixto; configurar días de corte y control de compras. |
| Reportes y membrete | Definir identidad institucional y generar PDF de prueba. |
| IA local (MCP) | Copiar configuración del servidor stdio y conocer sus tools. |
| Mi cuenta | Cambiar nombre, usuario y contraseña. |
| Usuarios | Crear cuentas, asignar roles y administrar estado. |
| Proyecto abierto | Consultar versión, licencia y documentación. |

“Adaptador funcional” significa que el módulo original se monta dentro del shell Vue 3 y conserva sus operaciones. Su DOM todavía no ha sido reescrito completamente como componente Vue SFC.
