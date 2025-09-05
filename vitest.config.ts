import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom', // Default to jsdom for React component tests
    globals: true,
    setupFiles: './vitest.setup.ts',
    // Use different environments based on file patterns
    environmentMatchGlobs: [
      ['**/*.integration.test.ts', 'node'], // Integration tests use Node
      ['**/server/**/*.test.ts', 'node'],  // Server tests use Node
      ['**/api/**/*.test.ts', 'node'],     // API tests use Node
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/e2e/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          statements: 26,
          branches: 69,
          functions: 49,
          lines: 26,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
