# Cafetal OS 2.5.0 — Ventas, kardex y operación verificable

Cafetal OS 2.5.0 completa el circuito comercial del café y corrige problemas detectados en compilación, captura masiva y operación semanal.

## Novedades

- **Ventas de café** como módulo independiente y conectado al inventario.
- Validación de existencias por producto y origen antes de confirmar una venta.
- Anulación controlada que restituye el inventario.
- **Kardex** cronológico con entradas, salidas, ventas y saldo acumulado.
- Alertas de permanencia por capa de inventario, humedad y tipo de café.
- Demo con ventas vinculadas a movimientos reales de inventario.
- Herramientas de desarrollo accesibles con `F12`, menú **Ver** y clic derecho → **Inspeccionar elemento**.

## Correcciones

- El panel **Pegar desde Excel** ahora ocupa el ancho disponible, muestra encabezados esperados y permite copiar una plantilla tabulada.
- La planilla semanal abre la última semana disponible en demo, muestra errores dentro del modal y valida que exista una cantidad antes de guardar.
- Se corrigieron los errores ESLint de los scripts MCP, `navigator`, variables no utilizadas y bloques de rollback vacíos.
- El workflow de release vuelve a detenerse únicamente ante errores reales de prueba, lint o compilación.

## Almacenamiento

Los avisos de antigüedad son señales operativas de revisión y no fechas universales de vencimiento. Para café seco o verde se incorpora vigilancia de humedad, destacando valores superiores a 12.5%.

## Publicación

La etiqueta correspondiente es:

```text
v2.5.0
```

Al enviarla a GitHub, el workflow compila Windows, macOS y Linux y publica los instaladores en GitHub Releases.
