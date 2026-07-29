/* eslint-env node */
const { resolve } = require('path')

module.exports = {
  parserOptions: {
    parser: require.resolve('@babel/eslint-parser'),
    requireConfigFile: false
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'standard'
  ],
  plugins: ['vue'],
  globals: {
    ga: 'readonly',
    cordova: 'readonly',
    __statics: 'readonly',
    __QUASAR_SSR__: 'readonly',
    __QUASAR_SSR_SERVER__: 'readonly',
    __QUASAR_SSR_CLIENT__: 'readonly',
    __QUASAR_SSR_PWA__: 'readonly',
    process: 'readonly',
    Capacitor: 'readonly',
    chrome: 'readonly'
  },
  rules: {
    'no-void': 'off',
    'multiline-ternary': 'off',
    'vue/multi-word-component-names': 'off',
    'no-unused-vars': 'warn'
  }
}
