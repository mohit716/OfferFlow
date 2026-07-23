import { Pool } from 'pg';
import dotenv from 'dotenv';
import { runMigrations } from '../src/db/migrator';
import { deriveTestUrl, deriveAdminUrl, testDatabaseName } from './testDb';

dotenv.config();

/**
 * Runs once before the whole test suite:
 *   1. Creates the "<db>_test" database if it doesn't exist.
 *   2. Applies all migrations to it.
 */
export default async function setup() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is required to run tests.');
  }

  const testUrl = deriveTestUrl(baseUrl);
  const adminUrl = deriveAdminUrl(baseUrl);
  const testDbName = testDatabaseName(baseUrl);

  // 1. Ensure the test database exists (CREATE DATABASE can't run in a tx).
  const admin = new Pool({ connectionString: adminUrl });
  try {
    const { rows } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [testDbName]
    );
    if (rows.length === 0) {
      // Identifier can't be parameterized; testDbName is derived locally, not user input.
      await admin.query(`CREATE DATABASE "${testDbName}"`);
    }
  } finally {
    await admin.end();
  }

  // 2. Migrate the test database.
  const testPool = new Pool({ connectionString: testUrl });
  try {
    await runMigrations(testPool);
  } finally {
    await testPool.end();
  }
}
