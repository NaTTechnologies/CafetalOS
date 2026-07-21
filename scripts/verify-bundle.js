const fs = require('node:fs')
const path = require('node:path')

const mainBundle = path.join('out', 'main', 'index.js')

if (!fs.existsSync(mainBundle)) {
  console.error(`No existe el bundle principal: ${mainBundle}`)
  process.exit(1)
}

const source = fs.readFileSync(mainBundle, 'utf8')
const unresolvedLocalRequires = [...source.matchAll(/require\(["'](\.\.?\/[^"']+)["']\)/g)].map((match) => match[1])

if (unresolvedLocalRequires.length) {
  console.error('El bundle principal conserva módulos locales sin resolver:')
  for (const request of unresolvedLocalRequires) console.error(` - ${request}`)
  process.exit(1)
}

if (!source.includes('class AuthStore')) {
  console.error('AuthStore no quedó integrado en el bundle principal.')
  process.exit(1)
}

console.log('Bundle principal verificado: AuthStore integrado y sin require locales pendientes.')
