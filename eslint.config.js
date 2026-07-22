const js = require('@eslint/js')
const pluginVue = require('eslint-plugin-vue')

const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', console: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', Intl: 'readonly', ResizeObserver: 'readonly',
  MutationObserver: 'readonly', Event: 'readonly', CustomEvent: 'readonly', HTMLElement: 'readonly'
}

const nodeGlobals = {
  process: 'readonly', Buffer: 'readonly', __dirname: 'readonly', __filename: 'readonly',
  require: 'readonly', module: 'readonly', exports: 'readonly', console: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', global: 'readonly'
}

module.exports = [
  {
    ignores: [
      'node_modules/**', 'out/**', 'dist/**', 'coverage/**', 'test-results/**', 'playwright-report/**',
      'src/renderer/public/legacy/**', 'src/renderer/public/assets/**', 'scripts/generate_demo_data.js'
    ]
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...browserGlobals, ...nodeGlobals }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/require-default-prop': 'off',
      'vue/html-self-closing': 'off'
    }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'commonjs', globals: nodeGlobals }
  }
]
