# Política de seguridad

## Versiones soportadas

La rama principal y la última versión publicada reciben correcciones de seguridad. Las versiones anteriores pueden no recibir parches.

## Reportar una vulnerabilidad

No publique vulnerabilidades explotables en una incidencia pública. Envíe un reporte privado mediante **Security Advisories** del repositorio e incluya:

- versión y sistema operativo;
- escenario de explotación;
- pasos mínimos para reproducir;
- impacto potencial sobre datos locales;
- propuesta de mitigación, cuando exista.

No incluya bases de datos reales, respaldos, nombres de productores ni información comercial sensible.

## Alcance de seguridad

La aplicación trabaja localmente. Los activos principales son la base `cafetal-os.db`, sus respaldos y los documentos exportados. Las contribuciones deben conservar `contextIsolation`, `sandbox`, `nodeIntegration: false`, canales IPC explícitos y consultas parametrizadas.

## Autenticación local

Desde la versión 2.1, los canales de datos requieren una sesión asociada a la ventana Electron. Las contraseñas se derivan con scrypt y no deben aparecer en incidencias, capturas, bases demo ni fixtures.

La cuenta inicial `admin` / `admin` está destinada exclusivamente a la primera ejecución. Los despliegues deben cambiarla antes de registrar información real.

## Seguridad del MCP local

- El servidor MCP usa `stdio` y se inicia solo cuando un cliente ejecuta Cafetal OS con `--mcp`.
- Las tools son de solo lectura por defecto; `--write` debe habilitarse conscientemente.
- No se expone una tool de SQL arbitrario ni la base de usuarios.
- Configure el cliente de IA para ejecutar únicamente el binario esperado y revise sus políticas de sincronización.
- No ejecute simultáneamente la interfaz y MCP con escritura sobre el mismo archivo de base, porque ambos procesos mantienen estado en memoria.
- Trate cualquier nueva tool de escritura como una superficie sensible: valide permisos, referencias y límites, y agregue pruebas.
