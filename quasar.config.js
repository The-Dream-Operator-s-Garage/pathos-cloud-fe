/* eslint-env node */
const { configure } = require('quasar/wrappers');

module.exports = configure(function (ctx) {
  return {
    supportTS: false,

    boot: [
      'axios'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
      'material-symbols-outlined'
    ],

    build: {
      vueRouterMode: 'hash',

      // The API origin is build-time config: PATHOS_API_URL (origin only,
      // no /api suffix — appended here). Unset, dev talks to the local API
      // and a prod build targets the deployed host (deployment-plan.md §2).
      env: {
        API_URL: (process.env.PATHOS_API_URL
          ? process.env.PATHOS_API_URL.replace(/\/+$/, '')
          : (ctx.dev ? 'http://localhost:3000' : 'https://api.pathos.cloud')) + '/api'
      }
    },

    devServer: {
      server: { type: 'http' },
      port: 8080,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },

    framework: {
      config: {
        dark: true,
        brand: {
          primary:   '#6C63FF',
          secondary: '#00BCD4',
          accent:    '#FF4081',
          dark:      '#0D0D1A',
          positive:  '#21BA45',
          negative:  '#C10015',
          info:      '#31CCEC',
          warning:   '#F2C037'
        }
      },
      plugins: [
        'Notify',
        'Dialog',
        'Loading'
      ]
    },

    animations: [],

    ssr: { pwa: false, middlewares: ['render'] },
    pwa: {},
    cordova: {},
    capacitor: { hideSplashscreen: true },
    electron: { bundler: 'packager' }
  };
});
