const fs = require('node:fs')
const path = require('node:path')

const targets = process.argv.slice(2)
if (!targets.length) {
  console.error('Indique al menos una ruta generada para limpiar.')
  process.exit(1)
}

for (const target of targets) {
  const absolute = path.resolve(process.cwd(), target)
  const root = path.resolve(process.cwd())
  if (absolute === root || !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Ruta de limpieza no permitida: ${target}`)
  }
  fs.rmSync(absolute, { recursive: true, force: true })
  console.log(`Limpieza: ${target}`)
}
