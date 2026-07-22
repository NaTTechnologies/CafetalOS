const path = require('node:path')
const { _electron: electron } = require('@playwright/test')
const { verifyScreenshotEnvironment } = require('../../../scripts/check-electron')

function collectOutput(child) {
  const lines = []
  const capture = (prefix, chunk) => {
    const text = String(chunk).trim()
    if (!text) return
    lines.push(`${prefix}: ${text}`)
    if (lines.length > 120) lines.shift()
  }
  child.stdout?.on('data', chunk => capture('stdout', chunk))
  child.stderr?.on('data', chunk => capture('stderr', chunk))
  return lines
}

async function launchCafetalOS({ userDataDir, demo = true, resetDemo = true, timeout = 60_000 } = {}) {
  const projectRoot = path.resolve(process.cwd())
  const { executablePath } = verifyScreenshotEnvironment(projectRoot)
  const args = ['--disable-gpu']
  if (process.platform === 'linux') args.push('--no-sandbox')
  args.push(projectRoot)
  if (demo) args.push('--demo')
  if (resetDemo) args.push('--reset-demo')
  if (userDataDir) args.push(`--user-data-path=${path.resolve(userDataDir)}`)

  let app
  try {
    app = await electron.launch({
      executablePath,
      args,
      cwd: projectRoot,
      timeout,
      env: {
        ...process.env,
        CAFETAL_OS_E2E: '1',
        ELECTRON_ENABLE_LOGGING: '1'
      }
    })
  } catch (error) {
    throw new Error(`Playwright no pudo lanzar Electron. ${error.message}`)
  }

  const child = app.process()
  const output = collectOutput(child)
  const exited = new Promise((_, reject) => {
    const fail = (code, signal) => reject(new Error(
      `Electron terminó antes de crear una ventana (código: ${code}, señal: ${signal || 'ninguna'}).\n${output.join('\n')}`
    ))
    if (child.exitCode !== null) fail(child.exitCode, child.signalCode)
    else child.once('exit', fail)
  })

  try {
    const page = await Promise.race([app.firstWindow({ timeout }), exited])
    await page.waitForLoadState('domcontentloaded')
    page.on('console', message => {
      if (message.type() === 'error') output.push(`renderer: ${message.text()}`)
    })
    page.on('pageerror', error => output.push(`pageerror: ${error.message}`))
    return { app, page, output }
  } catch (error) {
    await app.close().catch(() => {})
    throw new Error(`${error.message}\n\nDiagnóstico de Electron:\n${output.join('\n') || 'Sin salida capturada.'}`)
  }
}

async function resizeWindow(app, width, height) {
  await app.evaluate(({ BrowserWindow }, size) => {
    const window = BrowserWindow.getAllWindows()[0]
    if (!window) throw new Error('No existe una BrowserWindow activa.')
    window.setSize(size.width, size.height)
    window.center()
  }, { width, height })
}

async function closeMobileNavigation(page) {
  const sidebar = page.locator('.app-sidebar')
  const backdrop = page.getByRole('button', { name: 'Cerrar menú de navegación' })

  await backdrop.waitFor({ state: 'visible' })
  const [sidebarBox, backdropBox] = await Promise.all([
    sidebar.boundingBox(),
    backdrop.boundingBox()
  ])

  if (!sidebarBox || !backdropBox) {
    throw new Error('No fue posible medir el drawer móvil y su fondo de cierre.')
  }

  const sidebarRight = sidebarBox.x + sidebarBox.width
  if (backdropBox.x < sidebarRight - 1) {
    throw new Error(
      `El fondo móvil invade el drawer: backdrop.x=${backdropBox.x}, sidebar.right=${sidebarRight}.`
    )
  }

  await backdrop.click({ position: { x: Math.min(12, Math.max(1, backdropBox.width / 2)), y: 24 } })
}

module.exports = { launchCafetalOS, resizeWindow, closeMobileNavigation }
