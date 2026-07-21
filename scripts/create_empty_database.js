#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const initSqlJs = require('sql.js')

async function main() {
  const root = path.resolve(__dirname, '..')
  const schema = fs.readFileSync(path.join(root, 'database', 'schema.sql'), 'utf8')
  const seeds = fs.readFileSync(path.join(root, 'database', 'seeds.sql'), 'utf8')
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  db.run(schema)
  db.run(seeds)
  const output = path.join(root, 'database', 'cafetal-os.db')
  fs.writeFileSync(output, Buffer.from(db.export()))
  db.close()
  console.log(`Plantilla productiva limpia creada: ${output}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
