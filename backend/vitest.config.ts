import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { deriveTestUrl } from './tests/testDb';

// Load the real .env so we can derive the test database URL from DATABASE_URL.
dotenv.config();

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  throw new Error(
    'DATABASE_URL must be set (in backend/.env) to run the test suite.'
  );
}

export default defineConfig({
  test: {
    globalSetup: ['./tests/globalSetup.ts'],
    // Tests share a single database, so run files serially to avoid
    // cross-file interference when truncating tables.
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: deriveTestUrl(baseUrl),
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/scripts/**', 'src/db/**'],
    },
  },
});
