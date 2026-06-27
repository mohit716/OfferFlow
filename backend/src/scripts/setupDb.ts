import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

async function setupDb() {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schema);
    console.log('Database schema applied successfully');
  } catch (error) {
    console.error('Failed to apply schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDb();
