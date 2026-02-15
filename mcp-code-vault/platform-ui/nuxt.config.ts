export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', 'nuxt-icon'],
  css: ['~/app.css'],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  devServer: {
    port: 3001,
    host: typeof process.env.NUXT_HOST === 'string' && process.env.NUXT_HOST ? process.env.NUXT_HOST : undefined
  },
  routeRules: {
    '/': { prerender: false },
    '/config': { prerender: false },
    '/docs': { prerender: false }
  },
  experimental: {
    payloadExtraction: false
  },
  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    devProxy: (() => {
      const port = process.env.STATS_PORT || '3000';
      const base = `http://127.0.0.1:${port}`;
      return {
        '/metrics/stream': `${base}/metrics/stream`
      };
    })()
  }
})
