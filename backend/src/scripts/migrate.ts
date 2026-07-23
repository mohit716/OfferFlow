import { pool } from '../config/db';
import { runMigrations } from '../db/migrator';

async function main() {
  try {
    const ran = await runMigrations(pool);
    if (ran.length === 0) {
      console.log('No pending migrations. Database is up to date.');
    } else {
      console.log(`Applied ${ran.length} migration(s): ${ran.join(', ')}`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
