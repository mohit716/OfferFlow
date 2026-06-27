import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { pool, config } from '../config/db';
import { User } from '../types';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<{ user: Omit<User, 'created_at'>; token: string }> {
  const parsed = signupSchema.parse({ email, password, name });

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    parsed.email,
  ]);

  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [parsed.email, passwordHash, parsed.name]
  );

  const user = result.rows[0];
  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, signOptions);

  return { user, token };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: Omit<User, 'created_at'>; token: string }> {
  const parsed = loginSchema.parse({ email, password });

  const result = await pool.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [parsed.email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(parsed.password, user.password_hash);

  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const signOptions: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = jwt.sign({ userId: user.id }, config.jwtSecret, signOptions);

  return {
    user: { id: user.id, email: user.email, name: user.name },
    token,
  };
}

export async function getUserById(userId: number): Promise<Omit<User, 'created_at'> | null> {
  const result = await pool.query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}
