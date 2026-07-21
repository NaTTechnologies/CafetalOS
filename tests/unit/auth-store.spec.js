import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { AuthStore } from '../../src/main/auth-store.js'
const temporaryDirectories = []

function createStore() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cafetalos-auth-'))
  temporaryDirectories.push(directory)
  return new AuthStore(path.join(directory, 'users.json'))
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true })
})

describe('AuthStore', () => {
  it('creates the initial admin account', () => {
    const store = createStore()
    const user = store.authenticate('admin', 'admin')
    expect(user).toMatchObject({ username: 'admin', rol: 'admin', activo: true })
  })

  it('stores password hashes instead of plaintext passwords', () => {
    const store = createStore()
    const contents = fs.readFileSync(store.filePath, 'utf8')
    expect(contents).not.toContain('"password":"admin"')
    expect(contents).toContain('passwordHash')
  })

  it('allows an administrator to create multiple users', () => {
    const store = createStore()
    const admin = store.authenticate('admin', 'admin')
    const created = store.create({ username: 'catador', nombre: 'Catador', password: 'cafe123', rol: 'usuario' })
    expect(created.username).toBe('catador')
    expect(store.authenticate('catador', 'cafe123')).toMatchObject({ nombre: 'Catador', rol: 'usuario' })
    expect(store.list()).toHaveLength(2)
    expect(admin.rol).toBe('admin')
  })

  it('prevents disabling the current administrator session', () => {
    const store = createStore()
    const admin = store.authenticate('admin', 'admin')
    store.create({ username: 'admin2', nombre: 'Administrador 2', password: 'cafe123', rol: 'admin' })
    expect(() => store.update(admin, admin.id, { activo: false })).toThrow(/sesión actual/i)
  })
})
