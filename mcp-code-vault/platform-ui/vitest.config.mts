import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.ts', '**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['app.config.ts', 'nuxt.config.ts', 'app.vue', 'pages/**/*.vue', 'lib/**/*.ts'],
      exclude: ['node_modules/', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      thresholds: {
        global: {
          statements: 50,
          branches: 50,
          functions: 50,
          lines: 50
        }
      }
    }
  }
});
