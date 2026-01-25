/**
 * Vitest configuration for DomainLang CLI.
 *
 * @module
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: [
      'src/**/*.test.{ts,tsx}',
      'test/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test-utils/**',
      ],
    },
    testTimeout: 30000,
  },
});
