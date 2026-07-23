import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'src', 'db', 'migrations');

/**
 * Apply any pending SQL migrations in order.
 *
 * Migrations live in src/db/migrations as numbered .sql files (e.g.
 * 001_init.sql). Each applied migration is recorded in the
 * schema_migrations table so it only runs once. Each file runs inside a
 * transaction, so a failing migration rolls back cleanly.
 *
 * Returns the list of migration filenames that were applied this run.
 */
export async function runMigrations(pool: Pool): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query('SELECT id FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.id as string));

  const ran: string[] = [];

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      ran.push(file);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(
        `Migration ${file} failed: ${(error as Error).message}`
      );
    } finally {
      client.release();
    }
  }

  return ran;
}
