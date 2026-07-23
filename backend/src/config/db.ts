import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Read a required environment variable, failing fast with a clear message
 * if it is missing. This prevents insecure defaults (e.g. a hardcoded JWT
 * secret) from ever reaching a deployed environment.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Set it in your .env file.`
    );
  }
  return value;
}

const databaseUrl = requireEnv('DATABASE_URL');
const jwtSecret = requireEnv('JWT_SECRET');

export const pool = new Pool({
  connectionString: databaseUrl,
});

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
