const { defineConfig } = require('vitest/config')
const vue = require('@vitejs/plugin-vue')
const path = require('node:path')
module.exports = defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src/renderer/src') } },
  test: { include: ['tests/unit/**/*.spec.js'], environment: 'jsdom', globals: true, setupFiles: ['./tests/unit/setup.js'], coverage: { reporter: ['text','html'], include: ['src/renderer/src/**/*.{js,vue}'] } }
})
