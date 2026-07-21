const { test, expect } = require('@playwright/test')
const fs = require('node:fs')
const path = require('node:path')
const { launchCafetalOS, resizeWindow } = require('./helpers/electron-app')

let app, page
const userDataDir = path.join(process.cwd(), '.tmp', 'e2e-user-data')

test.beforeAll(async () => {
  fs.rmSync(userDataDir, { recursive: true, force: true })
  ;({ app, page } = await launchCafetalOS({ userDataDir }))
  await page.getByLabel('Usuario', { exact: true }).fill('admin')
  await page.getByLabel('Contraseña', { exact: true }).fill('admin')
  await page.getByRole('button', { name: 'Entrar a Cafetal OS' }).click()
  await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible()
})

test.afterAll(async () => app?.close())

test('abre el dashboard Vue después de autenticarse', async () => {
  await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible()
  await expect(page.getByText('Decisiones claras desde la finca')).toBeVisible()
})

test('busca y abre un módulo', async () => {
  const search = page.getByLabel('Buscar módulo')
  await search.fill('beneficio')
  await page.getByRole('option', { name: /Beneficio/ }).click()
  await expect(page.locator('.workspace-content')).toHaveAttribute('aria-label', 'Beneficio')
})

test('mantiene scroll interno independiente', async () => {
  await page.evaluate(() => window.App.cargarPagina('beneficio'))
  const workspace = page.getByTestId('workspace-scroll')
  await expect.poll(() => workspace.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)

  const sidebar = page.getByTestId('sidebar-scroll')
  await expect.poll(() => sidebar.evaluate(element => element.scrollHeight >= element.clientHeight)).toBe(true)
})

test('adapta la navegación como drawer móvil', async () => {
  await resizeWindow(app, 430, 900)
  await expect(page.locator('.app-shell')).toHaveClass(/is-mobile/)
  await page.getByRole('button', { name: 'Abrir o cerrar menú' }).click()
  await expect(page.locator('.app-shell')).toHaveClass(/mobile-menu-open/)
  await page.getByRole('button', { name: 'Cerrar menú de navegación' }).click()
  await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-menu-open/)
  await resizeWindow(app, 1440, 920)
})

test('abre configuración y controles de demo', async () => {
  await page.evaluate(() => window.App.cargarPagina('configuracion'))
  await expect(page.getByRole('heading', { name: 'Configuración de Cafetal OS' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cargar demo completa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Usuarios' })).toBeVisible()
})
