import crypto from 'crypto';
import { pool, config } from '../config/db';
import { UnauthorizedError } from '../errors';

/**
 * Refresh tokens are opaque random strings. We store only their SHA-256 hash,
 * so a database leak does not expose usable tokens. Tokens are revocable and
 * rotated on every use.
 */

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Create a new refresh token for a user and return the raw value. */
export async function issueRefreshToken(userId: number): Promise<string> {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlMs);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return raw;
}

/**
 * Validate a refresh token and rotate it: the old token is revoked and a new
 * one is issued. Returns the owning userId and the new raw refresh token.
 * Throws UnauthorizedError if the token is missing, unknown, revoked, or expired.
 */
export async function rotateRefreshToken(
  raw: string | undefined
): Promise<{ userId: number; newToken: string }> {
  if (!raw) {
    throw new UnauthorizedError('Missing refresh token');
  }

  const tokenHash = hashToken(raw);
  const { rows } = await pool.query(
    `SELECT id, user_id, expires_at, revoked
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );

  const record = rows[0];
  if (!record || record.revoked || new Date(record.expires_at) < new Date()) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Rotate: revoke the used token, issue a fresh one.
  await pool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [
    record.id,
  ]);
  const newToken = await issueRefreshToken(record.user_id);

  return { userId: record.user_id, newToken };
}

/** Revoke a single refresh token (used on logout). No-op if unknown. */
export async function revokeRefreshToken(
  raw: string | undefined
): Promise<void> {
  if (!raw) return;
  const tokenHash = hashToken(raw);
  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
    [tokenHash]
  );
}
