# Clima por Open-Meteo y modo local

## Objetivo

El módulo climático de Cafetal OS consulta condiciones meteorológicas actuales y un pronóstico de siete días para la ubicación configurada de la finca. La integración mantiene la arquitectura segura de Electron: la interfaz obtiene o selecciona coordenadas, mientras el proceso principal ejecuta la solicitud HTTPS, aplica la caché y persiste la lectura localmente.

## Arquitectura

```text
Renderer
  ├─ navigator.geolocation
  ├─ búsqueda manual de ubicación
  └─ componentes de clima y alertas
          │ IPC explícito
          ▼
Proceso Main de Electron
  ├─ validación de coordenadas
  ├─ net.fetch con timeout
  ├─ caché local de 30 minutos
  ├─ modo offline con última lectura disponible
  └─ persistencia en registros_clima
          │ HTTPS
          ▼
Open-Meteo Forecast API / Geocoding API
```

Las solicitudes externas nunca se realizan directamente desde el renderer.

## Variables consultadas

### Condiciones actuales

- `temperature_2m`
- `relative_humidity_2m`
- `surface_pressure`
- `apparent_temperature`
- `precipitation`
- `rain`
- `weather_code`
- `wind_speed_10m`
- `wind_direction_10m`

### Pronóstico diario

- temperatura máxima y mínima;
- precipitación acumulada;
- probabilidad máxima de precipitación;
- código meteorológico;
- viento máximo.

## Ubicación

El usuario dispone de tres rutas:

1. **Coordenadas de la finca:** se leen de la configuración o del campo `coordenadas` de Mi finca.
2. **Ubicación del dispositivo:** el renderer solicita permiso mediante `navigator.geolocation`.
3. **Búsqueda manual:** consulta la API de geocodificación de Open-Meteo al presionar explícitamente **Buscar**.

La búsqueda no funciona como autocompletado continuo. Las coordenadas seleccionadas se guardan en la base local.

## Caché y tolerancia a fallos

- TTL predeterminado: **30 minutos**.
- Clave de caché: latitud y longitud redondeadas a cuatro decimales.
- Durante el TTL, las solicitudes repetidas reutilizan el resultado guardado.
- Si la red falla y existe una lectura previa, el módulo muestra el dato como **caché local desactualizada**.
- Si no existe caché, el sistema activa el mensaje:

> Modo local activo: configure sus variables ambientales de forma manual.

El módulo no bloquea la aplicación cuando Open-Meteo no está disponible.

## Diagnóstico ambiental de extracción

Se implementaron las reglas incluidas en el ERS suministrado:

- humedad relativa mayor a 70%: advertencia de humedad alta y recomendación preventiva de ensanchar ligeramente la molienda;
- humedad relativa menor a 40%: advertencia de humedad baja y recomendación preventiva de cerrar ligeramente la molienda;
- entre 40% y 70%: estado ambiental estable.

Estas señales son orientativas para barismo. Deben confirmarse con dosis, rendimiento de bebida, tiempo de extracción y evaluación sensorial.

## Alertas fitosanitarias

Las alertas de extracción no sustituyen las alertas agronómicas. Cafetal OS conserva por separado:

- roya;
- broca;
- ojo de gallo;
- helada;
- sequía;
- inundación.

También mantiene la señal de vigilancia por humedad persistente cuando varios registros recientes superan 80%.

## Canales IPC

| Canal | Descripción |
|---|---|
| `clima:getLocation` | Obtiene la ubicación configurada o derivada de Mi finca. |
| `clima:setLocation` | Guarda coordenadas, nombre y zona horaria. |
| `clima:searchLocations` | Busca lugares mediante Open-Meteo Geocoding. |
| `clima:getCurrent` | Obtiene clima actual, pronóstico, alertas y estado de caché. |
| `clima:getProviderStatus` | Devuelve proveedor, conectividad y TTL. |
| `clima:getRegistros` | Lee la bitácora climática local. |
| `clima:crearRegistro` | Guarda una lectura manual. |

## Persistencia

`registros_clima` conserva:

- temperatura actual, máxima, mínima y sensación térmica;
- humedad relativa;
- presión superficial;
- precipitación y viento;
- código meteorológico;
- coordenadas, ubicación y zona horaria;
- proveedor y fecha de consulta.

La tabla `clima_api_cache` almacena la última respuesta normalizada por coordenadas.

## Privacidad

Las coordenadas permanecen en la base local. Solamente se envían a Open-Meteo cuando el usuario o la aplicación realiza una consulta meteorológica. Cafetal OS no incorpora telemetría propia para esta función.

## Fuentes técnicas

- Open-Meteo Forecast API: https://open-meteo.com/en/docs
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
- Electron `net.fetch`: https://www.electronjs.org/docs/latest/api/net
- Electron permissions: https://www.electronjs.org/docs/latest/api/session
