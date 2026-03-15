import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // So vite-node resolves @iconify/vue to the package (avoids "Cannot find module .../iconify.mjs" in tests)
      '@iconify/vue': path.join(dir, 'node_modules', '@iconify', 'vue'),
    },
  },
  test: {
    environment: 'happy-dom',
    server: {
      deps: {
        inline: ['@iconify/vue'],
      },
    },
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['*.ts', '**/.ts', '*.vue', '**/*.vue', '*.js', '**/*.js'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'debug-stub.js',
        '.*',
        '**/.*'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        perFile: true,
        branches: 1,
        functions: 1,
        lines: 1,
        statements: 1
      }
    }
  }
});
