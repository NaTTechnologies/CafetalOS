# Autenticación local y usuarios

Cafetal OS 2.1 incorpora autenticación local antes de mostrar los módulos de la finca. El objetivo es separar el trabajo de varias personas que utilizan el mismo equipo y evitar el acceso casual a la información.

## Primera ejecución

La aplicación crea automáticamente una cuenta inicial:

```text
Usuario: admin
Contraseña: admin
Rol: Administrador
```

Cambie la contraseña inmediatamente desde **Configuración → Mi cuenta**. La cuenta inicial solo se crea cuando el almacén de usuarios está vacío.

## Almacenamiento de credenciales

Los usuarios se guardan fuera de las bases productiva y demo, en el directorio `userData` de Electron:

```text
<userData>/security/users.json
```

Las contraseñas **no se guardan en texto plano**. Se derivan con `crypto.scrypt`, una sal aleatoria por usuario y comparación mediante `timingSafeEqual`. El archivo se escribe de forma atómica y con permisos restrictivos cuando el sistema operativo los admite.

La separación del almacén de seguridad permite cambiar entre la base productiva y la demostración sin perder las cuentas del equipo.

## Roles

### Administrador

Puede:

- crear usuarios;
- cambiar nombre, rol y estado de otras cuentas;
- restablecer la contraseña de otra cuenta;
- cambiar entre base productiva y demo;
- restaurar la demo;
- ejecutar respaldos y utilizar todos los módulos.

El sistema impide desactivar o degradar al último administrador activo.

### Usuario

Puede:

- iniciar sesión y utilizar los módulos de la finca;
- actualizar su nombre y usuario;
- cambiar su propia contraseña indicando la contraseña actual;
- crear respaldos manuales.

No puede administrar cuentas ni cambiar la base activa.

## Sesiones

El proceso principal asocia la sesión autenticada al `webContents.id` de la ventana. Los canales IPC, salvo `auth:login`, `auth:getCurrent`, `auth:logout` y `app:getInfo`, pasan por `secureHandle` y requieren una sesión válida.

El renderer nunca recibe `ipcRenderer` directamente. Las operaciones se exponen de forma explícita desde `src/preload/index.js`.

## API IPC de autenticación

```js
await window.api.auth.login({ username, password })
await window.api.auth.getCurrent()
await window.api.auth.logout()
await window.api.auth.listUsers()
await window.api.auth.createUser({ username, nombre, password, rol })
await window.api.auth.updateUser(id, { nombre, rol, activo })
await window.api.auth.changePassword({ userId, currentPassword, newPassword })
```

## Alcance de seguridad

Esta autenticación protege una aplicación local compartida; no sustituye:

- el cifrado completo del disco;
- las cuentas separadas del sistema operativo;
- una política corporativa de copias de seguridad;
- un servidor de identidad para trabajo multiestación;
- permisos por finca, lote o acción dentro de una misma cuenta.

Para equipos con información sensible se recomienda habilitar BitLocker, FileVault o cifrado equivalente y utilizar una cuenta del sistema operativo por persona.
