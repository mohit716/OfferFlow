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

const REFRESH_TOKEN_TTL_DAYS = parseInt(
  process.env.REFRESH_TOKEN_TTL_DAYS || '30',
  10
);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  // Short-lived access token (kept in memory on the client).
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  // Long-lived, revocable refresh token (httpOnly cookie).
  refreshTokenTtlDays: REFRESH_TOKEN_TTL_DAYS,
  refreshTokenTtlMs: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
