# Cafetal OS 2.6.0 — Clima conectado y planilla semanal corregida

Cafetal OS 2.6.0 corrige el error que impedía cargar la planilla semanal de cortadores y convierte el módulo de clima en una integración REST funcional con Open-Meteo.

## Correcciones

- Se eliminó el error `loteId is not defined` al consultar una semana de corte.
- La planilla transmite correctamente el identificador numérico del lote al proceso principal.
- Se agregó una prueba de regresión para evitar que el error vuelva a introducirse.

## Clima por API REST

- Condiciones actuales por coordenadas.
- Temperatura, humedad relativa y presión superficial.
- Sensación térmica, lluvia, viento y código meteorológico.
- Pronóstico de siete días.
- Geolocalización del dispositivo con permiso explícito.
- Búsqueda manual mediante Open-Meteo Geocoding.
- Caché local de 30 minutos.
- Recuperación de la última lectura durante fallos de red.
- Registro manual disponible en modo offline.
- Persistencia de lecturas Open-Meteo en la bitácora climática.

## Alertas

- Reglas ambientales de extracción para humedad alta, baja y estable.
- Alertas fitosanitarias independientes por lote.
- Señal de vigilancia cuando la humedad persistente supera el umbral operativo existente.

## Demo

La base demo incluye:

- 365 lecturas climáticas completas;
- temperatura actual y presión superficial;
- ubicación de Santa Bárbara, Honduras;
- siete días de pronóstico sintético;
- una respuesta Open-Meteo almacenada en caché para demostrar el modo offline;
- 20 cortadores, tres planillas semanales y 180 celdas registradas.

## Publicación

La etiqueta correspondiente es:

```text
v2.6.0
```

El workflow de GitHub compila Windows, macOS y Linux, genera sumas SHA-256 y adjunta los instaladores a la release.
