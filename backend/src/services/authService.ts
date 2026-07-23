import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { pool, config } from '../config/db';
import { User } from '../types';
import { ConflictError, UnauthorizedError } from '../errors';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type PublicUser = Omit<User, 'created_at'>;

/** Sign a short-lived access token for a user id. */
export function signAccessToken(userId: number): string {
  const signOptions: SignOptions = {
    expiresIn: config.accessTokenTtl as SignOptions['expiresIn'],
  };
  return jwt.sign({ userId }, config.jwtSecret, signOptions);
}

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<{ user: PublicUser; token: string }> {
  const parsed = signupSchema.parse({ email, password, name });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    parsed.email,
  ]);

  if (existing.rows.length > 0) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [parsed.email, passwordHash, parsed.name]
  );

  const user = result.rows[0];
  return { user, token: signAccessToken(user.id) };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: PublicUser; token: string }> {
  const parsed = loginSchema.parse({ email, password });

  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [parsed.email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(parsed.password, user.password_hash);

  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token: signAccessToken(user.id),
  };
}

export async function getUserById(
  userId: number
): Promise<PublicUser | null> {
  const result = await pool.query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}
