# Contrato IPC

El renderer accede a Electron únicamente mediante `window.api`, definido en `src/preload/index.js`. No se permite exponer `ipcRenderer` ni una función genérica que acepte canales arbitrarios.

## Sesión requerida

El proceso principal registra canales mediante `secureHandle(channel, listener)`. Antes de ejecutar un canal protegido se valida que el `webContents.id` tenga una sesión autenticada.

Canales públicos mínimos:

- `auth:login`;
- `auth:getCurrent`;
- `auth:logout`;
- `app:getInfo`.

Todos los demás canales requieren autenticación. Las verificaciones de rol adicionales se realizan dentro del handler correspondiente.

## Dominios expuestos

- `auth`: sesión, perfil, usuarios y contraseñas.
- `app`: información de versión, modo y apertura de documentación.
- `db`: estado, cambio de modo y respaldo.
- `dashboard`: indicadores y rentabilidad.
- `finca`, `variedades`, `lotes`.
- `recolectores`, `cosecha`, `beneficio`.
- `inventario`, `gastos`, `exportar`.
- `huella`, `practicas`, `certificaciones`, `calidad`.
- `trazabilidad`, `mercado`, `marketing`.
- `clima`, `suscripcion`, `educacion`.

## Ejemplo de autenticación

```js
const user = await window.api.auth.login({
  username: 'admin',
  password: 'admin'
})

const users = await window.api.auth.listUsers()
await window.api.auth.logout()
```

## Ejemplo de datos

```js
const lotes = await window.api.lotes.getAll()
const nuevo = await window.api.lotes.create({
  finca_id: 1,
  codigo: 'L-09',
  area_mz: 2.5,
  activo: 1
})
```

## Base de datos y demo

```js
const status = await window.api.db.getStatus()
await window.api.db.switchMode({ mode: 'demo', reset: true })
await window.api.db.switchMode({ mode: 'production', reset: false })
await window.api.db.backup()
```

`db.switchMode` exige rol Administrador.

## Eventos

`window.api.on(channel, callback)` admite únicamente `menu:nuevo`, `menu:guardar` y `navegar`. Retorna una función de limpieza:

```js
const remove = window.api.on('navegar', route => {
  // actualizar vista
})

remove()
```

## Reglas para nuevos canales

1. Nombre `dominio:acción`.
2. Método concreto en preload.
3. Registro con `secureHandle`, salvo justificación documentada para un canal público.
4. Autorización por rol cuando la operación sea administrativa.
5. Validación de tipo y rango en main.
6. SQL parametrizado.
7. Prueba de contrato.
8. No enviar rutas arbitrarias ni ejecutar contenido aportado por el renderer.
9. No devolver hashes, sales, secretos, objetos Electron ni rutas internas innecesarias.
