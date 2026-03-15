import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// Vitest/Vite can load this file with a non-file import.meta.url (e.g. virtual or http); use cwd in that case
function getRootDir(): string {
  try {
    const u = import.meta.url
    if (typeof u === 'string' && u.startsWith('file:')) {
      return fileURLToPath(new URL('.', u))
    }
  } catch (_) {}
  return process.cwd()
}
const rootDir = getRootDir()

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  // Disable DevTools so the component-inspector overlay is not injected (it passes style to a fragment-root component and triggers Vue warn)
  devtools: { enabled: false },
  build: { transpile: ['socket.io-client'] },
  vite: {
    resolve: {
      alias: {
        // socket.io-client pulls in "debug"; browser build has no ESM default export
        debug: join(rootDir, 'debug-stub.js'),
        'debug/src/browser.js': join(rootDir, 'debug-stub.js')
      }
    },
    optimizeDeps: {
      include: ['socket.io-client']
    },
    // Proxy API routes only. Do NOT proxy /socket.io: it causes ECONNRESET and restarts the dev server. Client connects directly to stats server (CORS allowed).
    server: {
      proxy: (() => {
        const port = process.env.STATS_PORT || '3000';
        const target = `http://127.0.0.1:${port}`;
        return {
          '/metrics': { target },
          '/metrics/stream': { target },
          '/projects': { target },
          '/scan/progress': { target }
        };
      })()
    }
  },
  css: ['~/app.css'],
  runtimeConfig: {
    public: {
      /** Stats server: port number (e.g. 3100) or full URL. Used for Socket.IO. API uses dev proxy; set STATS_PORT when running dev:ui so proxy targets your backend. */
      statsBaseUrl: process.env.NUXT_PUBLIC_UI_PORT ?? (process.env.NODE_ENV !== 'production' ? '3000' : ''),
      /** When true, Socket.IO connects to same origin (proxy). Disabled in dev to avoid proxy ECONNRESET restart loop; client connects directly with CORS. */
      useStatsProxy: false
    }
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  devServer: {
    // UI must not use 3000 — that's the MCP/stats server. NUXT_PORT (or 2999) wins over inherited PORT.
    port: Number(process.env.NUXT_PORT || process.env.NITRO_PORT) || 2999,
    // Listen on all interfaces, IPv4 and IPv6 (:: is dual-stack). Set NUXT_HOST to override (e.g. 127.0.0.1).
    host: typeof process.env.NUXT_HOST === 'string' && process.env.NUXT_HOST ? process.env.NUXT_HOST : '::'
  },
  routeRules: {
    '/': { prerender: false },
    '/config': { prerender: false },
    '/docs': { prerender: false },
    '/scan': { prerender: false }
  },
  experimental: {
    payloadExtraction: false
  },
  nitro: {
    compatibilityDate: '2026-02-15',
    compressPublicAssets: { gzip: true, brotli: true },
    devProxy: (() => {
      const port = process.env.STATS_PORT || '3000';
      const base = `http://127.0.0.1:${port}`;
      return {
        '/socket.io': base,
        '/metrics/stream': `${base}/metrics/stream`,
        '/metrics': `${base}/metrics`,
        '/projects': `${base}/projects`,
        '/scan/progress': `${base}/scan/progress`
      };
    })()
  }
})
