const { test, expect } = require('@playwright/test')
const fs = require('node:fs')
const path = require('node:path')
const { launchCafetalOS, resizeWindow } = require('./helpers/electron-app')

const outputDir = path.join(process.cwd(), 'IMG')
const desktopDir = path.join(outputDir, 'desktop')
const mobileDir = path.join(outputDir, 'mobile')
const userDataDir = path.join(process.cwd(), '.tmp', 'screenshots-user-data')

const modules = [
  ['01-resumen.png', 'inicio', 'Resumen'],
  ['02-mi-finca.png', 'finca', 'Mi finca'],
  ['03-lotes.png', 'lotes', 'Lotes'],
  ['04-cosecha.png', 'cosecha', 'Cosecha'],
  ['05-beneficio.png', 'beneficio', 'Beneficio'],
  ['06-inventario.png', 'inventario', 'Inventario'],
  ['07-gastos.png', 'gastos', 'Gastos'],
  ['08-reportes.png', 'reportes', 'Reportes'],
  ['09-sostenibilidad.png', 'sostenibilidad', 'Sostenibilidad'],
  ['10-calidad.png', 'calidad', 'Calidad'],
  ['11-trazabilidad.png', 'trazabilidad', 'Trazabilidad'],
  ['12-predictivo.png', 'predictivo', 'Predictivo'],
  ['13-mercado.png', 'mercado', 'Mercado'],
  ['14-clima.png', 'clima', 'Clima'],
  ['15-marketing.png', 'marketing', 'Marketing'],
  ['16-perfiles-cafe.png', 'suscripcion', 'Perfiles de café'],
  ['17-educacion.png', 'educacion', 'Educación'],
  ['18-ayuda.png', 'ayuda', 'Ayuda']
]

async function waitForVisualReady(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.waitForFunction(() => [...document.images].every(image => image.complete), null, { timeout: 15_000 })
  await page.waitForTimeout(350)
}

async function save(page, directory, filename) {
  await waitForVisualReady(page)
  await page.screenshot({
    path: path.join(directory, filename),
    fullPage: false,
    animations: 'disabled',
    caret: 'hide'
  })
}

async function openModule(page, route, label) {
  await page.evaluate(id => window.App.cargarPagina(id), route)
  await expect(page.locator('.workspace-content')).toHaveAttribute('data-page', route)
  await expect(page.locator('.workspace-content')).toHaveAttribute('aria-label', label)
  if (route !== 'inicio') {
    await expect(page.locator('.legacy-module-content')).not.toBeEmpty({ timeout: 15_000 })
  }
  await page.locator('.workspace-content').evaluate(element => element.scrollTo({ top: 0, left: 0 }))
  await waitForVisualReady(page)
}

async function captureSettings(page, directory) {
  await page.evaluate(() => window.App.cargarPagina('configuracion'))
  await expect(page.getByRole('heading', { name: 'Configuración de Cafetal OS' })).toBeVisible()
  await save(page, directory, '19-configuracion-datos.png')

  await page.getByRole('button', { name: 'Mi cuenta' }).click()
  await save(page, directory, '20-configuracion-cuenta.png')

  await page.getByRole('button', { name: 'Usuarios' }).click()
  await save(page, directory, '21-configuracion-usuarios.png')

  await page.getByRole('button', { name: 'Proyecto abierto' }).click()
  await save(page, directory, '22-configuracion-proyecto.png')
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(300_000)

test('genera la galería desktop y móvil con la base demo', async () => {
  fs.rmSync(userDataDir, { recursive: true, force: true })
  fs.rmSync(desktopDir, { recursive: true, force: true })
  fs.rmSync(mobileDir, { recursive: true, force: true })
  fs.mkdirSync(desktopDir, { recursive: true })
  fs.mkdirSync(mobileDir, { recursive: true })

  const { app, page } = await launchCafetalOS({ userDataDir, timeout: 75_000 })

  try {
    await resizeWindow(app, 1600, 1000)
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
    await save(page, desktopDir, '00-inicio-sesion.png')

    await resizeWindow(app, 430, 900)
    await save(page, mobileDir, '00-inicio-sesion.png')

    await resizeWindow(app, 1600, 1000)
    await page.getByLabel('Usuario', { exact: true }).fill('admin')
    await page.getByLabel('Contraseña', { exact: true }).fill('admin')
    await page.getByRole('button', { name: 'Entrar a Cafetal OS' }).click()
    await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible()

    for (const [filename, route, label] of modules) {
      await openModule(page, route, label)
      await save(page, desktopDir, filename)
    }
    await captureSettings(page, desktopDir)

    await resizeWindow(app, 430, 900)
    await openModule(page, 'inicio', 'Resumen')
    await page.getByRole('button', { name: 'Abrir o cerrar menú' }).click()
    await expect(page.locator('.app-shell')).toHaveClass(/mobile-menu-open/)
    await save(page, mobileDir, '00-menu-lateral.png')
    await page.getByRole('button', { name: 'Cerrar menú de navegación' }).click()

    for (const [filename, route, label] of modules) {
      await openModule(page, route, label)
      await save(page, mobileDir, filename)
    }
    await captureSettings(page, mobileDir)
  } finally {
    await app.close()
  }
})
