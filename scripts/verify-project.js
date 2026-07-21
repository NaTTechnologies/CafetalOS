const fs = require('node:fs')

const required = [
  'package.json',
  'electron.vite.config.js',
  'src/main/index.js',
  'src/preload/index.js',
  'src/renderer/src/App.vue',
  'database/schema.sql',
  'database/cafetal-os-demo.db',
  'database/demo_seeds.sql',
  'scripts/create_empty_database.js',
  'scripts/check-electron.js',
  'scripts/clean-generated.js',
  'scripts/ensure-electron.sh',
  'scripts/windows/ensure-electron.bat',
  'docs/DESARROLLO.md',
  'docs/RESPONSIVE_Y_MOVIL.md',
  'docs/IDENTIDAD_VISUAL.md',
  'docs/decisions/README.md',
  'branding/cafetal-os-logo-original.png',
  'branding/cafetal-os-logo-clean.png',
  'branding/cafetal-os-app-icon.png',
  'IMG/referencias/lotes-v2.0.png',
  'IMG/referencias/beneficio-v2.0.png',
  'COMMUNITY.md',
  'GOVERNANCE.md',
  'SUPPORT.md',
  'CITATION.cff',
  'scripts/verify-bundle.js',
  'src/main/auth-store.js',
  'src/renderer/src/views/LoginView.vue',
  'src/renderer/src/views/SettingsView.vue',
  'docs/AUTENTICACION_USUARIOS.md',
  'docs/CONFIGURACION_Y_DEMO.md',
  'docs/NAVEGACION_Y_UX.md',
  'docs/CAPTURAS_PLAYWRIGHT.md',
  'IMG/README.md',
  'tests/e2e/screenshots.spec.js',
  'capturar-pantallas.bat',
  'README.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'docs/MANUAL_USUARIO.md',
  'tests/unit/navigation.spec.js',
  'tests/unit/demo-integrity.spec.js',
  'scripts/windows/run-demo.bat'
]

const missing = required.filter((file) => !fs.existsSync(file))

if (missing.length) {
  console.error(`Faltan archivos esenciales:\n${missing.map((file) => ` - ${file}`).join('\n')}`)
  process.exit(1)
}

console.log(`Proyecto verificado: ${required.length} archivos esenciales presentes.`)
