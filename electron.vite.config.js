const { defineConfig } = require('electron-vite')
const vue = require('@vitejs/plugin-vue')
const path = require('node:path')

module.exports = defineConfig({
  main: {
    build: { rollupOptions: { external: ['sql.js', 'exceljs', 'pdfkit', 'qrcode'] } }
  },
  preload: {},
  renderer: {
    root: 'src/renderer',
    publicDir: 'public',
    resolve: { alias: { '@': path.resolve(__dirname, 'src/renderer/src') } },
    plugins: [vue()]
  }
})
