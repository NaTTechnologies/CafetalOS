const fs = require('node:fs')
const path = require('node:path')

function resolveElectronExecutable(projectRoot = process.cwd()) {
  const packageJsonPath = require.resolve('electron/package.json', { paths: [projectRoot] })
  const packageDirectory = path.dirname(packageJsonPath)
  const pathFile = path.join(packageDirectory, 'path.txt')

  if (!fs.existsSync(pathFile)) {
    throw new Error(
      'Electron está declarado en node_modules, pero falta electron/path.txt. Ejecute: npx install-electron --no'
    )
  }

  const relativeExecutable = fs.readFileSync(pathFile, 'utf8').trim()
  if (!relativeExecutable) throw new Error('electron/path.txt está vacío.')

  const executablePath = path.join(packageDirectory, 'dist', relativeExecutable)
  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `No se encontró el ejecutable de Electron en ${executablePath}. Ejecute: npx install-electron --no`
    )
  }

  return executablePath
}

function verifyElectronBinary(projectRoot = process.cwd()) {
  return { executablePath: resolveElectronExecutable(projectRoot) }
}

function verifyScreenshotEnvironment(projectRoot = process.cwd()) {
  const packagePath = path.join(projectRoot, 'package.json')
  const mainEntry = path.join(projectRoot, 'out', 'main', 'index.js')
  const preloadEntry = path.join(projectRoot, 'out', 'preload', 'index.js')
  const rendererEntry = path.join(projectRoot, 'out', 'renderer', 'index.html')

  if (!fs.existsSync(packagePath)) throw new Error('No se encontró package.json en la raíz del proyecto.')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  if (pkg.main !== './out/main/index.js') {
    throw new Error(`package.json.main debe apuntar a ./out/main/index.js y actualmente apunta a ${pkg.main}`)
  }

  for (const file of [mainEntry, preloadEntry, rendererEntry]) {
    if (!fs.existsSync(file)) throw new Error(`Falta el archivo compilado ${file}. Ejecute npm run build:app.`)
  }

  const mainBundle = fs.readFileSync(mainEntry, 'utf8')
  if (mainBundle.includes("require('./auth-store')") || mainBundle.includes('require("./auth-store")')) {
    throw new Error('El bundle principal conserva un require local de auth-store y Electron no podrá iniciar.')
  }
  if (!mainBundle.includes('class AuthStore')) {
    throw new Error('AuthStore no quedó integrado en el bundle principal.')
  }

  return {
    executablePath: resolveElectronExecutable(projectRoot),
    mainEntry,
    preloadEntry,
    rendererEntry
  }
}

if (require.main === module) {
  try {
    const binaryOnly = process.argv.includes('--binary-only')
    const result = binaryOnly ? verifyElectronBinary() : verifyScreenshotEnvironment()
    console.log('Entorno de capturas verificado.')
    console.log(`Electron: ${result.executablePath}`)
    if (result.mainEntry) console.log(`Entrada: ${result.mainEntry}`)
  } catch (error) {
    console.error(`[ERROR] ${error.message}`)
    process.exitCode = 1
  }
}

module.exports = { resolveElectronExecutable, verifyElectronBinary, verifyScreenshotEnvironment }
