import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const HASH_BYTES = 64
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, HASH_BYTES, SCRYPT_OPTIONS)
  return { salt, hash: derived.toString('hex') }
}

function verifyPassword(password, salt, expectedHash) {
  try {
    const actual = crypto.scryptSync(String(password), salt, HASH_BYTES, SCRYPT_OPTIONS)
    const expected = Buffer.from(expectedHash, 'hex')
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo !== false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

class AuthStore {
  constructor(filePath) {
    this.filePath = filePath
    this.data = { version: 1, nextId: 1, users: [] }
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
        if (Array.isArray(parsed.users)) this.data = parsed
      }
    } catch (error) {
      const backup = `${this.filePath}.corrupt-${Date.now()}`
      try { fs.copyFileSync(this.filePath, backup) } catch { /* best-effort backup */ }
      console.error('No se pudo leer el almacén de usuarios:', error)
    }

    if (!this.data.users.length) {
      const credentials = hashPassword('admin')
      const now = new Date().toISOString()
      this.data.users.push({
        id: this.data.nextId++,
        username: 'admin',
        nombre: 'Administrador',
        rol: 'admin',
        activo: true,
        passwordSalt: credentials.salt,
        passwordHash: credentials.hash,
        createdAt: now,
        updatedAt: now
      })
      this.save()
    }
  }

  save() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true })
    const temp = `${this.filePath}.tmp`
    fs.writeFileSync(temp, JSON.stringify(this.data, null, 2), { mode: 0o600 })
    fs.renameSync(temp, this.filePath)
  }

  authenticate(username, password) {
    const normalized = normalizeUsername(username)
    const user = this.data.users.find(item => item.username === normalized && item.activo !== false)
    if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) return null
    return publicUser(user)
  }

  getById(id) {
    return this.data.users.find(user => user.id === Number(id)) || null
  }

  list() {
    return this.data.users.map(publicUser).sort((a, b) => a.username.localeCompare(b.username))
  }

  create(input) {
    const username = normalizeUsername(input.username)
    const password = String(input.password || '')
    const nombre = String(input.nombre || username).trim()
    const rol = input.rol === 'admin' ? 'admin' : 'usuario'

    if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('El usuario debe tener entre 3 y 40 caracteres válidos.')
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')
    if (this.data.users.some(user => user.username === username)) throw new Error('Ese nombre de usuario ya existe.')

    const credentials = hashPassword(password)
    const now = new Date().toISOString()
    const user = {
      id: this.data.nextId++, username, nombre, rol, activo: true,
      passwordSalt: credentials.salt, passwordHash: credentials.hash,
      createdAt: now, updatedAt: now
    }
    this.data.users.push(user)
    this.save()
    return publicUser(user)
  }

  update(actor, id, changes) {
    const user = this.getById(id)
    if (!user) throw new Error('Usuario no encontrado.')
    const isSelf = Number(actor.id) === Number(user.id)
    const isAdmin = actor.rol === 'admin'
    if (!isSelf && !isAdmin) throw new Error('No tiene permiso para editar este usuario.')

    if (changes.username !== undefined) {
      const username = normalizeUsername(changes.username)
      if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('Nombre de usuario inválido.')
      if (this.data.users.some(item => item.id !== user.id && item.username === username)) throw new Error('Ese nombre de usuario ya existe.')
      user.username = username
    }
    if (changes.nombre !== undefined) user.nombre = String(changes.nombre || '').trim() || user.username

    if (isAdmin && changes.rol !== undefined) {
      const nextRole = changes.rol === 'admin' ? 'admin' : 'usuario'
      if (user.rol === 'admin' && nextRole !== 'admin' && this.activeAdminCount() <= 1) {
        throw new Error('Debe permanecer al menos un administrador activo.')
      }
      user.rol = nextRole
    }

    if (isAdmin && changes.activo !== undefined) {
      const nextActive = Boolean(changes.activo)
      if (isSelf && !nextActive) throw new Error('No puede desactivar la cuenta de la sesión actual.')
      if (user.rol === 'admin' && user.activo !== false && !nextActive && this.activeAdminCount() <= 1) {
        throw new Error('No puede desactivar al último administrador.')
      }
      user.activo = nextActive
    }

    user.updatedAt = new Date().toISOString()
    this.save()
    return publicUser(user)
  }

  changePassword(actor, targetId, currentPassword, newPassword) {
    const user = this.getById(targetId)
    if (!user) throw new Error('Usuario no encontrado.')
    const isSelf = Number(actor.id) === Number(user.id)
    const isAdmin = actor.rol === 'admin'
    if (!isSelf && !isAdmin) throw new Error('No tiene permiso para cambiar esa contraseña.')
    if (isSelf && !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      throw new Error('La contraseña actual no es correcta.')
    }
    if (String(newPassword || '').length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres.')
    const credentials = hashPassword(newPassword)
    user.passwordSalt = credentials.salt
    user.passwordHash = credentials.hash
    user.updatedAt = new Date().toISOString()
    this.save()
    return true
  }

  activeAdminCount() {
    return this.data.users.filter(user => user.rol === 'admin' && user.activo !== false).length
  }
}

export { AuthStore, publicUser }
