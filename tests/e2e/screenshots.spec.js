const { test, expect } = require('@playwright/test')
const fs = require('node:fs')
const path = require('node:path')
const { launchCafetalOS, resizeWindow, closeMobileNavigation } = require('./helpers/electron-app')

const outputDir = path.join(process.cwd(), 'IMG')
const desktopDir = path.join(outputDir, 'desktop')
const mobileDir = path.join(outputDir, 'mobile')
const userDataDir = path.join(process.cwd(), '.tmp', 'screenshots-user-data')

const modules = [
  ['01-resumen.png', 'inicio', 'Resumen'],
  ['02-mi-finca.png', 'finca', 'Mi finca'],
  ['03-lotes.png', 'lotes', 'Lotes'],
  ['04-cosecha.png', 'cosecha', 'Cosecha'],
  ['05-compras-cafe.png', 'compras', 'Compras de café'],
  ['06-ventas-cafe.png', 'ventas', 'Ventas de café'],
  ['07-beneficio.png', 'beneficio', 'Beneficio'],
  ['08-inventario.png', 'inventario', 'Inventario'],
  ['09-gastos.png', 'gastos', 'Gastos'],
  ['10-reportes.png', 'reportes', 'Reportes'],
  ['11-sostenibilidad.png', 'sostenibilidad', 'Sostenibilidad'],
  ['12-calidad.png', 'calidad', 'Calidad'],
  ['13-trazabilidad.png', 'trazabilidad', 'Trazabilidad'],
  ['14-predictivo.png', 'predictivo', 'Predictivo'],
  ['15-mercado.png', 'mercado', 'Mercado'],
  ['16-clima.png', 'clima', 'Clima'],
  ['17-marketing.png', 'marketing', 'Marketing'],
  ['18-perfiles-cafe.png', 'suscripcion', 'Perfiles de café'],
  ['19-educacion.png', 'educacion', 'Educación'],
  ['20-ayuda.png', 'ayuda', 'Ayuda']
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
  await save(page, directory, '20-configuracion-datos.png')

  await page.getByRole('button', { name: 'Perfil operativo' }).click()
  await expect(page.getByRole('heading', { name: 'Perfil de operación cafetalera' })).toBeVisible()
  await save(page, directory, '21-configuracion-operacion.png')

  await page.getByRole('button', { name: 'Reportes y membrete' }).click()
  await expect(page.getByRole('heading', { name: 'Identidad institucional' })).toBeVisible()
  await save(page, directory, '22-configuracion-membrete.png')

  await page.getByRole('button', { name: 'IA local (MCP)' }).click()
  await expect(page.getByRole('heading', { name: 'Servidor MCP por stdio' })).toBeVisible()
  await save(page, directory, '23-configuracion-mcp.png')

  await page.getByRole('button', { name: 'Mi cuenta' }).click()
  await save(page, directory, '24-configuracion-cuenta.png')

  await page.getByRole('button', { name: 'Usuarios' }).click()
  await save(page, directory, '25-configuracion-usuarios.png')

  await page.getByRole('button', { name: 'Proyecto abierto' }).click()
  await save(page, directory, '26-configuracion-proyecto.png')
}

async function captureOperationalDialogs(page, directory, prefix = '') {
  await openModule(page, 'cosecha', 'Cosecha')
  await page.getByRole('button', { name: /Planilla semanal/i }).click()
  await expect(page.getByRole('heading', { name: 'Planilla semanal de cortadores' })).toBeVisible()
  await save(page, directory, `${prefix}planilla-semanal.png`)
  await page.getByRole('button', { name: 'Cancelar' }).last().click()

  await openModule(page, 'lotes', 'Lotes')
  await page.getByRole('button', { name: /Registro masivo/i }).click()
  await expect(page.getByRole('heading', { name: 'Registro masivo de lotes' })).toBeVisible()
  await save(page, directory, `${prefix}registro-masivo-lotes.png`)
  await page.getByRole('button', { name: 'Cancelar' }).last().click()

  await openModule(page, 'compras', 'Compras de café')
  await page.getByRole('button', { name: /Compras masivas/i }).click()
  await expect(page.getByRole('heading', { name: 'Compras masivas de café' })).toBeVisible()
  await save(page, directory, `${prefix}registro-masivo-compras.png`)
  await page.getByRole('button', { name: /Pegar desde Excel/i }).click()
  await expect(page.getByRole('heading', { name: 'Pegar filas desde Excel o Google Sheets' })).toBeVisible()
  await save(page, directory, `${prefix}pegar-excel-compras.png`)
  await page.getByRole('button', { name: 'Cancelar' }).last().click()
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
    await captureOperationalDialogs(page, desktopDir, '27-')

    await resizeWindow(app, 430, 900)
    await openModule(page, 'inicio', 'Resumen')
    await page.getByRole('button', { name: 'Abrir o cerrar menú' }).click()
    await expect(page.locator('.app-shell')).toHaveClass(/mobile-menu-open/)
    await save(page, mobileDir, '00-menu-lateral.png')
    await closeMobileNavigation(page)
    await expect(page.locator('.app-shell')).not.toHaveClass(/mobile-menu-open/)

    for (const [filename, route, label] of modules) {
      await openModule(page, route, label)
      await save(page, mobileDir, filename)
    }
    await captureSettings(page, mobileDir)
    await captureOperationalDialogs(page, mobileDir, '27-')
  } finally {
    await app.close()
  }
})
