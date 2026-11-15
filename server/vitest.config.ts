import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    // Run setup to start in‑memory MongoDB for integration tests
    setupFiles: ['./tests/setup.ts'],
  },
});
