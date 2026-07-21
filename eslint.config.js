const js = require('@eslint/js')
const pluginVue = require('eslint-plugin-vue')
module.exports = [
  { ignores: ['node_modules/**','out/**','dist/**','coverage/**','src/renderer/public/legacy/**','src/renderer/public/assets/**','scripts/generate_demo_data.js'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  { files: ['**/*.{js,vue}'], languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { window:'readonly', document:'readonly', console:'readonly', process:'readonly', Buffer:'readonly', __dirname:'readonly', require:'readonly', module:'readonly', setTimeout:'readonly', Intl:'readonly', ResizeObserver:'readonly', global:'readonly' } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'vue/multi-word-component-names': 'off', 'vue/max-attributes-per-line': 'off', 'vue/html-indent': 'off', 'vue/singleline-html-element-content-newline': 'off', 'vue/require-default-prop': 'off', 'vue/html-self-closing': 'off' } }
]
